
import { useState, useEffect } from 'react';
import { MeetingFile, Speaker, SpeakerStatus, VoiceprintProfile, Hotword, Template, ViewState, Folder, ShareConfig, TranscriptSegment } from '../types';
import { transcribeAudio } from '../services/geminiService';
import { sliceAudio, getAudioDuration } from '../services/audioUtils';
import { supabaseService } from '../services/supabaseService';
import { MOCK_SHARED_MEETINGS } from '../data/mockSharedMeetings';
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates';

const SPEAKER_COLORS = [
  'text-blue-600 bg-blue-50 border-blue-200',
  'text-emerald-600 bg-emerald-50 border-emerald-200',
  'text-purple-600 bg-purple-50 border-purple-200',
  'text-amber-600 bg-amber-50 border-amber-200',
  'text-rose-600 bg-rose-50 border-rose-200',
];

export const useAppStore = () => {
  // --- 状态定义 ---
  const [view, setView] = useState<ViewState>('home');
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [shareConfig, setShareConfig] = useState<ShareConfig | null>(null);
  const [teamId, setTeamId] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null); // userId can be null if not logged in
  const [userName, setUserName] = useState<string>(""); // 用户昵称

  // 数据状态
  const [meetings, setMeetings] = useState<MeetingFile[]>([]);
  const [deletedMeetings, setDeletedMeetings] = useState<MeetingFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [voiceprints, setVoiceprints] = useState<VoiceprintProfile[]>([]);
  const [hotwords, setHotwords] = useState<Hotword[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Fetcher Logic (Reused for init and login) ---
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const currentTeamId = await supabaseService.getCurrentTeamId();
      setTeamId(currentTeamId);

      // 并行加载所有数据
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

      // 检查并恢复默认模版
      let finalTemplates = fetchedTemplates;
      if (fetchedTemplates.length === 0) {
        finalTemplates = DEFAULT_TEMPLATES; 
      }

      // 处理会议数据 (合并模拟共享数据)
      const allMeetings = [...fetchedMeetings.active, ...MOCK_SHARED_MEETINGS];
      setMeetings(allMeetings);
      setDeletedMeetings(fetchedMeetings.deleted);

      // 处理文件夹关联
      const foldersWithIds = fetchedFolders.map(f => ({
        ...f,
        meetingIds: allMeetings.filter(m => m.folderId === f.id).map(m => m.id)
      }));
      
      setFolders(foldersWithIds);
      setTemplates(finalTemplates);
      setVoiceprints(fetchedVoiceprints);
      setHotwords(fetchedHotwords);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 初始化：检查登录状态并加载数据 ---
  useEffect(() => {
    const init = async () => {
      // Initialize UserName
      let storedName = localStorage.getItem('jimu_app_username');
      if (!storedName) {
        storedName = `积木用户${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem('jimu_app_username', storedName);
      }
      setUserName(storedName);

      const storedUserId = await supabaseService.getCurrentUserId();
      if (storedUserId) {
        setUserId(storedUserId);
        await fetchAllData();
      } else {
        setIsLoading(false); // No user, stop loading to show AuthView
      }
    };
    init();
  }, []);

  // --- Helper Getter ---
  const activeMeeting = meetings.find(m => m.id === activeMeetingId) || null;

  // --- Actions ---

  const login = async (identifier: string) => {
    setIsLoading(true);
    const newUserId = await supabaseService.login(identifier);
    setUserId(newUserId);
    await fetchAllData();
    setView('home'); // Reset view to home after login
  };

  const logout = async () => {
    await supabaseService.logout();
    setUserId(null);
    setMeetings([]);
    setFolders([]);
    setVoiceprints([]);
    setHotwords([]);
    setView('home');
  };

  const updateUserName = (name: string) => {
    setUserName(name);
    localStorage.setItem('jimu_app_username', name);
  };

  const joinTeam = async (newTeamId: string) => {
    const success = await supabaseService.setTeamId(newTeamId);
    if (success) {
      setTeamId(newTeamId);
      // Clear data to avoid mixing before new fetch completes
      setMeetings([]);
      setFolders([]);
      // Fetch new team data
      await fetchAllData();
    }
  };

  const accessMeeting = (id: string) => {
    // 乐观更新 UI
    setMeetings(prev => prev.map(m => 
      m.id === id ? { ...m, lastAccessedAt: new Date() } : m
    ));
    // 异步更新数据库
    if (!id.startsWith('mock_')) {
      supabaseService.updateMeeting(id, { lastAccessedAt: new Date() });
    }
    
    setActiveMeetingId(id);
    setView('detail');
  };

  const updateMeeting = (id: string, updates: Partial<MeetingFile>) => {
    // 乐观更新
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

    // 数据库更新
    if (!id.startsWith('mock_')) {
      supabaseService.updateMeeting(id, updates);
    }
  };

  const addFolder = (name: string) => {
    const newFolder = { id: `folder_${Date.now()}`, name, meetingIds: [] };
    setFolders(prev => [...prev, newFolder]);
    supabaseService.createFolder(newFolder);
  };

  const updateFolder = (id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    supabaseService.updateFolder(id, name);
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setMeetings(prev => prev.map(m => m.folderId === id ? { ...m, folderId: undefined } : m));
    if (selectedFolderId === id) setSelectedFolderId(null);
    
    supabaseService.deleteFolder(id);
  };

  const moveMeetingToFolder = (meetingId: string, folderId: string | null) => {
    // 乐观更新会议状态
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, folderId: folderId || undefined } : m));
    // 乐观更新文件夹计数 (meetingIds 只是前端派生状态，不需要存回 DB)
    setFolders(prev => prev.map(f => {
      const filteredIds = f.meetingIds.filter(id => id !== meetingId);
      if (f.id === folderId) {
        return { ...f, meetingIds: [...filteredIds, meetingId] };
      }
      return { ...f, meetingIds: filteredIds };
    }));

    if (!meetingId.startsWith('mock_')) {
      supabaseService.updateMeeting(meetingId, { folderId: folderId || undefined });
    }
  };

  const deleteMeeting = (id: string) => {
    const meetingToDelete = meetings.find(m => m.id === id);
    if (meetingToDelete) {
      const deletedAt = new Date();
      setDeletedMeetings(prev => [{ ...meetingToDelete, deletedAt }, ...prev]);
      setMeetings(prev => prev.filter(m => m.id !== id));
      
      // Update folders state to remove this meeting ID and update count
      if (meetingToDelete.folderId) {
         setFolders(prev => prev.map(f =>
           f.id === meetingToDelete.folderId
             ? { ...f, meetingIds: f.meetingIds.filter(mid => mid !== id) }
             : f
         ));
      }

      if (activeMeetingId === id) {
        setActiveMeetingId(null);
        if (view === 'detail') setView('home');
      }

      if (!id.startsWith('mock_')) {
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

      // Update folders state to add this meeting ID back (if it belongs to a folder)
      if (rest.folderId) {
         setFolders(prev => prev.map(f =>
           f.id === rest.folderId
             ? { ...f, meetingIds: [...f.meetingIds, id] }
             : f
         ));
      }

      if (!id.startsWith('mock_')) {
        supabaseService.updateMeeting(id, { deletedAt: undefined }); // 恢复，即清除 deletedAt
      }
    }
  };

  const permanentDeleteMeeting = async (id: string) => {
    const meeting = deletedMeetings.find(m => m.id === id);
    setDeletedMeetings(prev => prev.filter(m => m.id !== id));
    if (!id.startsWith('mock_') && meeting) {
      await supabaseService.deleteMeetingPermanent(id, meeting.format);
    }
  };

  const emptyRecycleBin = async () => {
    const toDelete = [...deletedMeetings];
    setDeletedMeetings([]); // 乐观更新：立即清空 UI

    // 批量执行删除操作
    for (const meeting of toDelete) {
      if (!meeting.id.startsWith('mock_')) {
        // 不等待单个结果，避免阻塞
        supabaseService.deleteMeetingPermanent(meeting.id, meeting.format)
          .catch(err => console.error(`Failed to delete meeting ${meeting.id}`, err));
      }
    }
  };

  const generateSpeakersFromTranscript = (transcript: TranscriptSegment[]) => {
    const uniqueIds = Array.from(new Set(transcript.map(s => s.speakerId)));
    const newSpeakers: Record<string, Speaker> = {};
    uniqueIds.forEach((sid, idx) => {
       newSpeakers[sid] = {
          id: sid,
          defaultLabel: `发言人 ${idx + 1}`,
          name: `发言人 ${idx + 1}`,
          status: SpeakerStatus.IDENTIFIED,
          color: SPEAKER_COLORS[idx % SPEAKER_COLORS.length]
       };
    });
    return newSpeakers;
  };

  const createMeeting = async (file: File, trimStart = 0, trimEnd = 0, source: 'upload' | 'recording' | 'hardware' = 'upload') => {
    let fileToProcess = file;
    if (trimStart > 0 || (trimEnd > 0 && trimEnd < file.size)) {
      try {
        fileToProcess = await sliceAudio(file, trimStart, trimEnd);
      } catch (error) {
        console.warn("Audio slicing failed:", error);
      }
    }

    // Generate ID based on source
    let idPrefix = '';
    if (source === 'hardware') idPrefix = 'hardware_';
    else if (source === 'recording') idPrefix = 'rec_';
    const id = `${idPrefix}${Date.now()}`;
    
    // 临时 URL 用于 UI 立即显示
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
      isStarred: false,
      transcript: []
    };
    
    // 1. UI 立即更新
    setMeetings(prev => [newMeeting, ...prev]);
    if (selectedFolderId) {
      setFolders(prev => prev.map(f => f.id === selectedFolderId ? { ...f, meetingIds: [...f.meetingIds, id] } : f));
    }

    // 2. 后台上传并创建
    try {
      // Supabase Upload
      await supabaseService.createMeeting(newMeeting, fileToProcess);

      // Gemini Transcribe
      const transcript = await transcribeAudio(fileToProcess);
      
      // Auto-populate speakers
      const speakers = generateSpeakersFromTranscript(transcript);

      // Update Meeting with result
      const updates = { 
        status: 'ready' as const, 
        transcript,
        speakers
      };
      
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      supabaseService.updateMeeting(id, updates);

   } catch (error) {
      console.error("Processing failed", JSON.stringify(error, null, 2));
      const updates = { status: 'error' as const };
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      supabaseService.updateMeeting(id, updates);
   }
  };

  const toggleStarMeeting = (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    if (meeting) {
      updateMeeting(id, { isStarred: !meeting.isStarred });
    }
  };

  const duplicateMeeting = async (id: string) => {
    const original = meetings.find(m => m.id === id);
    if (!original) return;

    const newId = `copy_${Date.now()}`;
    const newName = `${original.name} (副本)`;
    
    const copy: MeetingFile = {
      ...original,
      id: newId,
      name: newName,
      uploadDate: new Date(),
      lastAccessedAt: new Date(),
      isStarred: false,
    };

    setMeetings(prev => [copy, ...prev]);
    
    // Note: Actual file duplication in backend is omitted for brevity in this frontend logic
    // Ideally we should copy the file in Supabase storage and create a new record.
  };

  const retryProcessMeeting = async (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return;

    updateMeeting(id, { status: 'processing' });
    
    // Attempt to recover file from URL if file object is missing
    let fileToProcess = meeting.file;
    if (!fileToProcess && meeting.url) {
      try {
        const res = await fetch(meeting.url);
        const blob = await res.blob();
        fileToProcess = new File([blob], `${meeting.name}.${meeting.format}`, { type: blob.type });
      } catch (e) {
        console.error("Failed to fetch file for retry", e);
      }
    }

    if (fileToProcess) {
      try {
        const transcript = await transcribeAudio(fileToProcess);
        const speakers = generateSpeakersFromTranscript(transcript);
        updateMeeting(id, { status: 'ready', transcript, speakers });
      } catch (error) {
        updateMeeting(id, { status: 'error' });
      }
    } else {
      updateMeeting(id, { status: 'error' });
    }
  };

  // --- Voiceprints ---
  const addVoiceprint = (name: string, file?: Blob) => {
    const newVp: VoiceprintProfile = {
      id: `vp_${Date.now()}`,
      name,
      createdAt: new Date()
    };
    setVoiceprints(prev => [newVp, ...prev]);
    supabaseService.createVoiceprint(newVp, file);
  };

  const updateVoiceprint = (id: string, name?: string, file?: Blob) => {
    setVoiceprints(prev => prev.map(vp => vp.id === id ? { ...vp, name: name || vp.name } : vp));
    supabaseService.updateVoiceprint(id, name, file);
  };

  const deleteVoiceprint = (id: string) => {
    setVoiceprints(prev => prev.filter(vp => vp.id !== id));
    supabaseService.deleteVoiceprint(id);
  };

  // --- Hotwords ---
  const addHotword = (word: string, category: string) => {
    const newHw: Hotword = {
      id: `hw_${Date.now()}`,
      word,
      category,
      createdAt: new Date()
    };
    setHotwords(prev => [newHw, ...prev]);
    supabaseService.createHotword(newHw);
  };

  const updateHotword = (id: string, word: string, category: string) => {
    setHotwords(prev => prev.map(hw => hw.id === id ? { ...hw, word, category } : hw));
    supabaseService.updateHotword(id, word, category);
  };

  const deleteHotword = (id: string) => {
    setHotwords(prev => prev.filter(hw => hw.id !== id));
    supabaseService.deleteHotword(id);
  };

  // --- Templates ---
  const addTemplate = (template: Template) => {
    setTemplates(prev => [template, ...prev]);
    supabaseService.createTemplate(template);
  };

  const updateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    supabaseService.updateTemplate(id, updates);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    supabaseService.deleteTemplate(id);
  };

  const toggleStarTemplate = (id: string) => {
    const tpl = templates.find(t => t.id === id);
    if (tpl) {
      updateTemplate(id, { isStarred: !tpl.isStarred });
    }
  };

  return {
    view, setView,
    activeMeetingId, setActiveMeetingId,
    activeMeeting,
    selectedFolderId, setSelectedFolderId,
    searchQuery, setSearchQuery,
    shareConfig, setShareConfig,
    
    meetings,
    deletedMeetings,
    folders,
    voiceprints,
    hotwords,
    templates,
    isLoading,
    teamId, // Export Team ID
    userId, // Export User ID
    userName, // Export User Name
    
    updateUserName,
    login,
    logout,
    joinTeam, // Export Team Switcher
    createMeeting,
    accessMeeting,
    updateMeeting,
    deleteMeeting,
    restoreMeeting,
    permanentDeleteMeeting,
    emptyRecycleBin,
    moveMeetingToFolder,
    toggleStarMeeting,
    duplicateMeeting,
    retryProcessMeeting,

    addFolder,
    updateFolder,
    deleteFolder,

    addVoiceprint,
    updateVoiceprint,
    deleteVoiceprint,

    addHotword,
    updateHotword,
    deleteHotword,

    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleStarTemplate
  };
};
