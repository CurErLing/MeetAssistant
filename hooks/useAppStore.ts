
import { useState, useEffect } from 'react';
import { MeetingFile, Speaker, SpeakerStatus, VoiceprintProfile, Hotword, Template, ViewState, Folder, ShareConfig } from '../types';
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

  // 数据状态
  const [meetings, setMeetings] = useState<MeetingFile[]>([]);
  const [deletedMeetings, setDeletedMeetings] = useState<MeetingFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [voiceprints, setVoiceprints] = useState<VoiceprintProfile[]>([]);
  const [hotwords, setHotwords] = useState<Hotword[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 初始化：从 Supabase 加载数据 ---
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
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
          console.log("Templates empty, seeding defaults...");
          await supabaseService.seedTemplates(DEFAULT_TEMPLATES);
          finalTemplates = DEFAULT_TEMPLATES; // 乐观更新，不需要重新fetch
        }

        // 处理会议数据 (合并模拟共享数据)
        const allMeetings = [...fetchedMeetings.active, ...MOCK_SHARED_MEETINGS];
        setMeetings(allMeetings);
        setDeletedMeetings(fetchedMeetings.deleted);

        // 处理文件夹关联
        // Supabase folders表不直接存 meetingIds，我们在前端计算
        const foldersWithIds = fetchedFolders.map(f => ({
          ...f,
          meetingIds: allMeetings.filter(m => m.folderId === f.id).map(m => m.id)
        }));
        
        // 直接使用数据库中的文件夹，不使用默认内存文件夹，避免 FK 冲突
        setFolders(foldersWithIds);
        
        setTemplates(finalTemplates);
        setVoiceprints(fetchedVoiceprints);
        setHotwords(fetchedHotwords);

      } catch (error) {
        console.error("Failed to initialize data from Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  // --- Helper Getter ---
  const activeMeeting = meetings.find(m => m.id === activeMeetingId) || null;

  // --- Actions ---

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
    // 注意：还需要更新所有受影响 meeting 的 folder_id 为 null，Supabase FK 可以设置 ON DELETE SET NULL 自动处理
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
      isStarred: false 
    };
    
    // 1. UI 立即更新
    setMeetings(prev => [newMeeting, ...prev]);
    if (selectedFolderId) {
      setFolders(prev => prev.map(f => f.id === selectedFolderId ? { ...f, meetingIds: [...f.meetingIds, id] } : f));
    }

    // 2. 后台上传并创建数据库记录
    try {
      await supabaseService.createMeeting(newMeeting, fileToProcess);
      
      // 3. 转写
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

      // 更新本地和远程状态为 Ready
      updateMeeting(id, { status: 'ready', transcript: segments, speakers: newSpeakers });

    } catch (error: any) {
      console.error("Create meeting failed:", error.message || JSON.stringify(error));
      updateMeeting(id, { status: 'error' });
    }
  };

  const retryProcessMeeting = async (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return;

    updateMeeting(id, { status: 'processing' });

    try {
      let fileToProcess = meeting.file;
      // Try to recover file from URL if File object is lost (e.g. page refresh)
      if (!fileToProcess && meeting.url) {
          try {
              const res = await fetch(meeting.url);
              const blob = await res.blob();
              fileToProcess = new File([blob], `${meeting.name}.${meeting.format}`, { type: meeting.format === 'mp3' ? 'audio/mpeg' : 'audio/wav' });
          } catch(e) {
              console.error("Failed to fetch audio for retry", e);
          }
      }

      if (!fileToProcess) throw new Error("Audio file not found. Please re-upload.");

      // Transcribe
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
      
      // Update DB with new transcript
      supabaseService.updateMeeting(id, { status: 'ready', transcript: segments, speakers: newSpeakers });

    } catch (error: any) {
      console.error("Retry failed:", error);
      updateMeeting(id, { status: 'error' });
    }
  };

  const toggleStarMeeting = (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    if (meeting) {
      const newVal = !meeting.isStarred;
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, isStarred: newVal } : m));
      if (!id.startsWith('mock_')) {
        supabaseService.updateMeeting(id, { isStarred: newVal });
      }
    }
  };

  const duplicateMeeting = async (id: string) => {
     // 复制功能涉及文件复制，在 Supabase 中可以通过 copy 存储文件实现
     // 简化版：暂不支持云端文件的直接复制操作，或者仅在前端复制元数据？
     // 此处保留为空实现或提示用户，或者实现完整的后端复制逻辑。
     alert("暂不支持云端文件复制功能");
  };

  // --- 管理功能 Action (直接连接 Supabase) ---
  const addVoiceprint = async (name: string, file?: Blob) => {
    const id = `vp_${Date.now()}`;
    const newVp = { id, name, createdAt: new Date() };
    setVoiceprints(prev => [newVp, ...prev]);
    await supabaseService.createVoiceprint(newVp, file);
  };

  const updateVoiceprint = async (id: string, name?: string, file?: Blob) => {
    setVoiceprints(prev => prev.map(vp => vp.id === id ? { ...vp, name: name || vp.name } : vp));
    await supabaseService.updateVoiceprint(id, name, file);
  };

  const deleteVoiceprint = async (id: string) => {
    setVoiceprints(prev => prev.filter(vp => vp.id !== id));
    await supabaseService.deleteVoiceprint(id);
  };

  const addHotword = (word: string, category: string) => {
    const newHw = { id: `hw_${Date.now()}`, word, category, createdAt: new Date() };
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

  const addTemplate = (template: Template) => {
    setTemplates(prev => [...prev, template]);
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
    if(tpl) {
       setTemplates(prev => prev.map(t => t.id === id ? { ...t, isStarred: !t.isStarred } : t));
       supabaseService.updateTemplate(id, { isStarred: !tpl.isStarred });
    }
  };

  return {
    view, setView, activeMeetingId, setActiveMeetingId, activeMeeting, meetings, deletedMeetings, folders, 
    selectedFolderId, setSelectedFolderId, voiceprints, hotwords, templates, accessMeeting,
    updateMeeting, deleteMeeting, restoreMeeting, permanentDeleteMeeting, createMeeting, retryProcessMeeting, 
    addFolder, updateFolder, deleteFolder, moveMeetingToFolder, 
    addVoiceprint, updateVoiceprint, deleteVoiceprint,
    addHotword, updateHotword, deleteHotword, addTemplate, updateTemplate, deleteTemplate, toggleStarTemplate,
    toggleStarMeeting, duplicateMeeting, isLoading,
    searchQuery, setSearchQuery,
    shareConfig, setShareConfig
  };
};
