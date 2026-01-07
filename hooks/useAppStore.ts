
import { useState, useEffect } from 'react';
import { MeetingFile, Speaker, SpeakerStatus, VoiceprintProfile, Hotword, Template, ViewState, Folder, ShareConfig } from '../types';
import { transcribeAudio } from '../services/geminiService';
import { sliceAudio, getAudioDuration } from '../services/audioUtils';
import { supabaseService } from '../services/supabaseService';
import { MOCK_SHARED_MEETINGS } from '../data/mockSharedMeetings';
import { MOCK_LOCAL_MEETINGS } from '../data/mockLocalMeetings';
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates';

const SPEAKER_COLORS = [
  'text-blue-600 bg-blue-50 border-blue-200',
  'text-emerald-600 bg-emerald-50 border-emerald-200',
  'text-purple-600 bg-purple-50 border-purple-200',
  'text-amber-600 bg-amber-50 border-amber-200',
  'text-rose-600 bg-rose-50 border-rose-200',
];

// User type compatible with Supabase user
interface User {
  id: string;
  email?: string;
}

export const useAppStore = (user?: User) => {
  // --- 状态定义 ---
  const [view, setView] = useState<ViewState>('home');
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [shareConfig, setShareConfig] = useState<ShareConfig | null>(null);

  // 数据状态
  const [meetings, setMeetings] = useState<MeetingFile[]>([]);
  const [deletedMeetings, setDeletedMeetings] = useState<MeetingFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [voiceprints, setVoiceprints] = useState<VoiceprintProfile[]>([]);
  const [hotwords, setHotwords] = useState<Hotword[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine mock mode:
  // 1. Explicit mock email (admin@mock.com)
  // 2. Phone auth mocks (@phone.mock)
  // 3. Guest ID (2025000001)
  const isMockMode = user?.email === 'admin@mock.com' || user?.email === 'guest@mock.com' || user?.email?.endsWith('@phone.mock') || user?.id === '2025000001';

  // --- 初始化：从 Supabase 或 Mock 加载数据 ---
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (isMockMode) {
          // Mock / Guest Mode: Load Local Mocks
          setMeetings([...MOCK_LOCAL_MEETINGS, ...MOCK_SHARED_MEETINGS]);
          setFolders([{ id: 'mock_folder_1', name: '产品规划', meetingIds: ['mock_local_1'] }]);
          setTemplates(DEFAULT_TEMPLATES);
          setVoiceprints([]);
          setHotwords([]);
        } else {
          // Real User Mode: Supabase
          try {
            const [
              fetchedMeetings,
              fetchedFolders,
              fetchedTemplates,
              fetchedVoiceprints,
              fetchedHotwords
            ] = await Promise.all([
              supabaseService.fetchMeetings(),
              supabaseService.fetchFolders(),
              supabaseService.fetchTemplates(),
              supabaseService.fetchVoiceprints(),
              supabaseService.fetchHotwords()
            ]);

            let finalTemplates = fetchedTemplates;
            if (fetchedTemplates.length === 0) {
              // Seed default templates for new real users
              await supabaseService.seedTemplates(DEFAULT_TEMPLATES);
              finalTemplates = DEFAULT_TEMPLATES;
            }

            const allMeetings = fetchedMeetings.active;
            setMeetings(allMeetings);
            setDeletedMeetings(fetchedMeetings.deleted);

            const foldersWithIds = fetchedFolders.map(f => ({
              ...f,
              meetingIds: allMeetings.filter(m => m.folderId === f.id).map(m => m.id)
            }));
            
            setFolders(foldersWithIds);
            setTemplates(finalTemplates);
            setVoiceprints(fetchedVoiceprints);
            setHotwords(fetchedHotwords);
          } catch (dbError: any) {
            console.error("Supabase Database Error:", dbError);
            throw new Error(`数据库连接失败: ${dbError.message || '请检查控制台详情'}`);
          }
        }

      } catch (error: any) {
        console.error("Failed to initialize data:", error);
        setError(error.message || "无法加载数据，请检查网络或刷新重试。");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) initData();
  }, [user, isMockMode]);

  // --- Helper Getter ---
  const activeMeeting = meetings.find(m => m.id === activeMeetingId) || null;

  // --- Actions ---

  const accessMeeting = (id: string) => {
    setMeetings(prev => prev.map(m => 
      m.id === id ? { ...m, lastAccessedAt: new Date() } : m
    ));
    if (!isMockMode && !id.startsWith('mock_')) {
      supabaseService.updateMeeting(id, { lastAccessedAt: new Date() });
    }
    setActiveMeetingId(id);
    setView('detail');
  };

  const updateMeeting = (id: string, updates: Partial<MeetingFile>) => {
    setMeetings(prev => prev.map(m => {
      if (m.id === id) {
        if (m.isReadOnly) {
           const allowedUpdates: Partial<MeetingFile> = {};
           if ('folderId' in updates) allowedUpdates.folderId = updates.folderId;
           if ('isStarred' in updates) allowedUpdates.isStarred = updates.isStarred;
           if (Object.keys(allowedUpdates).length > 0) return { ...m, ...allowedUpdates };
           return m;
        }
        return { ...m, ...updates };
      }
      return m;
    }));

    if (!isMockMode && !id.startsWith('mock_')) {
      supabaseService.updateMeeting(id, updates);
    }
  };

  const addFolder = (name: string) => {
    const newFolder = { id: `folder_${Date.now()}`, name, meetingIds: [] };
    setFolders(prev => [...prev, newFolder]);
    if (!isMockMode) supabaseService.createFolder(newFolder);
  };

  const updateFolder = (id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    if (!isMockMode) supabaseService.updateFolder(id, name);
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setMeetings(prev => prev.map(m => m.folderId === id ? { ...m, folderId: undefined } : m));
    if (selectedFolderId === id) setSelectedFolderId(null);
    
    if (!isMockMode) supabaseService.deleteFolder(id);
  };

  const moveMeetingToFolder = (meetingId: string, folderId: string | null) => {
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, folderId: folderId || undefined } : m));
    setFolders(prev => prev.map(f => {
      const filteredIds = f.meetingIds.filter(id => id !== meetingId);
      if (f.id === folderId) {
        return { ...f, meetingIds: [...filteredIds, meetingId] };
      }
      return { ...f, meetingIds: filteredIds };
    }));

    if (!isMockMode && !meetingId.startsWith('mock_')) {
      supabaseService.updateMeeting(meetingId, { folderId: folderId || undefined });
    }
  };

  const deleteMeeting = (id: string) => {
    const meetingToDelete = meetings.find(m => m.id === id);
    if (meetingToDelete) {
      const deletedAt = new Date();
      setDeletedMeetings(prev => [{ ...meetingToDelete, deletedAt }, ...prev]);
      setMeetings(prev => prev.filter(m => m.id !== id));
      
      if (activeMeetingId === id) {
        setActiveMeetingId(null);
        if (view === 'detail') setView('home');
      }

      if (!isMockMode && !id.startsWith('mock_')) {
        supabaseService.updateMeeting(id, { deletedAt });
      }
    }
  };

  const restoreMeeting = (id: string) => {
    const meetingToRestore = deletedMeetings.find(m => m.id === id);
    if (meetingToRestore) {
      const { deletedAt, ...rest } = meetingToRestore;
      setMeetings(prev => [rest, ...prev]);
      setDeletedMeetings(prev => prev.filter(m => m.id !== id));

      if (!isMockMode && !id.startsWith('mock_')) {
        supabaseService.updateMeeting(id, { deletedAt: undefined });
      }
    }
  };

  const permanentDeleteMeeting = async (id: string) => {
    const meeting = deletedMeetings.find(m => m.id === id);
    setDeletedMeetings(prev => prev.filter(m => m.id !== id));
    if (!isMockMode && !id.startsWith('mock_') && meeting) {
      await supabaseService.deleteMeetingPermanent(id, meeting.format);
    }
  };

  const createMeeting = async (file: File, trimStart = 0, trimEnd = 0) => {
    let fileToProcess = file;
    if (trimStart > 0 || trimEnd > 0) {
      try {
        fileToProcess = await sliceAudio(file, trimStart, trimEnd);
      } catch (error) {
        console.warn("Audio slicing failed:", error);
      }
    }

    const id = Date.now().toString();
    const url = URL.createObjectURL(fileToProcess);
    
    let duration = 0;
    try {
      duration = await getAudioDuration(fileToProcess);
    } catch (e) { console.warn(e); }

    const newMeeting: MeetingFile = { 
      id, 
      name: file.name.replace(/\.[^/.]+$/, ""), 
      file: fileToProcess, 
      url, 
      duration: duration,
      format: fileToProcess.name.endsWith('.mp3') ? 'mp3' : 'wav', 
      uploadDate: new Date(),
      lastAccessedAt: new Date(), 
      status: 'processing', 
      speakers: {}, 
      trimStart: 0, 
      trimEnd: 0,
      folderId: selectedFolderId || undefined,
      isStarred: false 
    };
    
    setMeetings(prev => [newMeeting, ...prev]);
    if (selectedFolderId) {
      setFolders(prev => prev.map(f => f.id === selectedFolderId ? { ...f, meetingIds: [...f.meetingIds, id] } : f));
    }

    try {
      if (!isMockMode) {
        await supabaseService.createMeeting(newMeeting, fileToProcess).catch(err => {
            console.error("Supabase create meeting error:", err);
            throw err;
        });
      }
      
      const segments = await transcribeAudio(fileToProcess, { start: 0, end: 0 });
      const uniqueSpeakerIds = Array.from(new Set(segments.map(s => s.speakerId)));
      const newSpeakers: Record<string, Speaker> = {};
      uniqueSpeakerIds.forEach((sid, index) => {
        newSpeakers[sid] = { 
          id: sid, 
          defaultLabel: `发言人 ${index + 1}`, 
          name: `发言人 ${index + 1}`, 
          status: SpeakerStatus.IDENTIFIED, 
          color: SPEAKER_COLORS[index % SPEAKER_COLORS.length] 
        };
      });

      updateMeeting(id, { status: 'ready', transcript: segments, speakers: newSpeakers });

    } catch (error: any) {
      console.error("Create meeting failed (Full):", error);
      updateMeeting(id, { status: 'error' });
      setError(`文件创建失败: ${error.message}`);
    }
  };

  const retryProcessMeeting = async (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return;

    updateMeeting(id, { status: 'processing' });

    try {
      let fileToProcess = meeting.file;
      if (!fileToProcess && meeting.url) {
          try {
              const res = await fetch(meeting.url);
              const blob = await res.blob();
              fileToProcess = new File([blob], `${meeting.name}.${meeting.format}`, { type: meeting.format === 'mp3' ? 'audio/mpeg' : 'audio/wav' });
          } catch(e) {}
      }

      if (!fileToProcess) throw new Error("Audio file not found. Please re-upload.");

      const segments = await transcribeAudio(fileToProcess, { start: meeting.trimStart, end: meeting.trimEnd });
      const uniqueSpeakerIds = Array.from(new Set(segments.map(s => s.speakerId)));
      const newSpeakers: Record<string, Speaker> = {};
      uniqueSpeakerIds.forEach((sid, index) => {
        newSpeakers[sid] = { 
          id: sid, 
          defaultLabel: `发言人 ${index + 1}`, 
          name: `发言人 ${index + 1}`, 
          status: SpeakerStatus.IDENTIFIED, 
          color: SPEAKER_COLORS[index % SPEAKER_COLORS.length] 
        };
      });

      updateMeeting(id, { status: 'ready', transcript: segments, speakers: newSpeakers });
      
      if (!isMockMode) {
        supabaseService.updateMeeting(id, { status: 'ready', transcript: segments, speakers: newSpeakers });
      }

    } catch (error: any) {
      updateMeeting(id, { status: 'error' });
    }
  };

  const toggleStarMeeting = (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    if (meeting) {
      const newVal = !meeting.isStarred;
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, isStarred: newVal } : m));
      if (!isMockMode && !id.startsWith('mock_')) {
        supabaseService.updateMeeting(id, { isStarred: newVal });
      }
    }
  };

  const duplicateMeeting = async (id: string) => {
     alert("暂不支持云端文件复制功能");
  };

  // --- 管理功能 Action ---
  const addVoiceprint = async (name: string, file?: Blob) => {
    const id = `vp_${Date.now()}`;
    const newVp = { id, name, createdAt: new Date() };
    setVoiceprints(prev => [newVp, ...prev]);
    if (!isMockMode) await supabaseService.createVoiceprint(newVp, file);
  };

  const updateVoiceprint = async (id: string, name?: string, file?: Blob) => {
    setVoiceprints(prev => prev.map(vp => vp.id === id ? { ...vp, name: name || vp.name } : vp));
    if (!isMockMode) await supabaseService.updateVoiceprint(id, name, file);
  };

  const deleteVoiceprint = async (id: string) => {
    setVoiceprints(prev => prev.filter(vp => vp.id !== id));
    if (!isMockMode) await supabaseService.deleteVoiceprint(id);
  };

  const addHotword = (word: string, category: string) => {
    const newHw = { id: `hw_${Date.now()}`, word, category, createdAt: new Date() };
    setHotwords(prev => [newHw, ...prev]);
    if (!isMockMode) supabaseService.createHotword(newHw);
  };

  const updateHotword = (id: string, word: string, category: string) => {
    setHotwords(prev => prev.map(hw => hw.id === id ? { ...hw, word, category } : hw));
    if (!isMockMode) supabaseService.updateHotword(id, word, category);
  };

  const deleteHotword = (id: string) => {
    setHotwords(prev => prev.filter(hw => hw.id !== id));
    if (!isMockMode) supabaseService.deleteHotword(id);
  };

  const addTemplate = (template: Template) => {
    setTemplates(prev => [...prev, template]);
    if (!isMockMode) supabaseService.createTemplate(template);
  };

  const updateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (!isMockMode) supabaseService.updateTemplate(id, updates);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (!isMockMode) supabaseService.deleteTemplate(id);
  };

  const toggleStarTemplate = (id: string) => {
    const tpl = templates.find(t => t.id === id);
    if(tpl) {
       setTemplates(prev => prev.map(t => t.id === id ? { ...t, isStarred: !t.isStarred } : t));
       if (!isMockMode) supabaseService.updateTemplate(id, { isStarred: !tpl.isStarred });
    }
  };

  return {
    view, setView, activeMeetingId, setActiveMeetingId, activeMeeting, meetings, deletedMeetings, folders, 
    selectedFolderId, setSelectedFolderId, voiceprints, hotwords, templates, accessMeeting,
    updateMeeting, deleteMeeting, restoreMeeting, permanentDeleteMeeting, createMeeting, retryProcessMeeting, 
    addFolder, updateFolder, deleteFolder, moveMeetingToFolder, 
    addVoiceprint, updateVoiceprint, deleteVoiceprint,
    addHotword, updateHotword, deleteHotword, addTemplate, updateTemplate, deleteTemplate, toggleStarTemplate,
    toggleStarMeeting, duplicateMeeting, isLoading, error,
    searchQuery, setSearchQuery,
    shareConfig, setShareConfig
  };
};
