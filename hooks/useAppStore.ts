
import { useState, useEffect, useCallback } from 'react';
import { MeetingFile, Folder, Template, VoiceprintProfile, Hotword, ViewState, ShareConfig, Speaker } from '../types';
import { supabaseService } from '../services/supabaseService';
import { transcribeAudio } from '../services/geminiService';
import { sliceAudio, getAudioDuration } from '../services/audioUtils';
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates';
import { MOCK_LOCAL_MEETINGS } from '../data/mockLocalMeetings';
import { MOCK_SHARED_MEETINGS } from '../data/mockSharedMeetings';

// Helper
const generateSpeakersFromTranscript = (transcript: any[]) => {
  const speakers: Record<string, Speaker> = {};
  const speakerIds = new Set(transcript.map(t => t.speakerId));
  speakerIds.forEach(id => {
    speakers[id] = {
        id,
        name: id === 'spk_1' ? 'Speaker 1' : (id === 'spk_2' ? 'Speaker 2' : id),
        defaultLabel: '发言人',
        status: 'IDENTIFIED',
        color: 'text-slate-700'
    } as Speaker;
  });
  return speakers;
};

export const useAppStore = () => {
  const [meetings, setMeetings] = useState<MeetingFile[]>([...MOCK_LOCAL_MEETINGS, ...MOCK_SHARED_MEETINGS]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [voiceprints, setVoiceprints] = useState<VoiceprintProfile[]>([]);
  const [hotwords, setHotwords] = useState<Hotword[]>([]);
  
  const [view, setView] = useState<ViewState>('home');
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [shareConfig, setShareConfig] = useState<ShareConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [userId, setUserId] = useState<string | null>('user_123');
  const [userName, setUserName] = useState("Guest");
  const [isLoading, setIsLoading] = useState(false);

  const activeMeeting = meetings.find(m => m.id === activeMeetingId);
  
  const activeMeetings = meetings.filter(m => !m.deletedAt);
  const recycledMeetings = meetings.filter(m => !!m.deletedAt);

  const login = (identifier: string) => {
      setUserId(identifier);
      setUserName(identifier);
  };

  const logout = () => {
      setUserId(null);
  };

  const createMeeting = async (file: File, trimStart = 0, trimEnd = 0, source: 'upload' | 'recording' | 'hardware' = 'upload') => {
    let fileToProcess = file;
    
    // Only slice if user actually adjusted the trim handles
    // Fixed bug: trimEnd < file.size was comparing seconds to bytes
    if (trimStart > 0 || trimEnd > 0) {
      try {
        fileToProcess = await sliceAudio(file, trimStart, trimEnd);
      } catch (error) {
        console.warn("Audio slicing failed, using original file:", error);
      }
    }

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
      // In production, update Supabase here
      // supabaseService.updateMeeting(id, updates);

   } catch (error: any) {
      console.error("Processing failed:", error);
      const updates = { status: 'error' as const };
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      // Don't update DB status here if the meeting creation itself failed (e.g. upload failed)
      if (error.message !== "Audio upload failed") {
         // supabaseService.updateMeeting(id, updates);
      }
   }
  };

  const updateMeeting = (id: string, updates: Partial<MeetingFile>) => {
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMeeting = (id: string) => {
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, deletedAt: new Date() } : m));
  };

  const accessMeeting = (id: string) => {
      setActiveMeetingId(id);
      setView('detail');
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, lastAccessedAt: new Date() } : m));
  };

  // Folder Logic
  const addFolder = (name: string) => {
      const newFolder: Folder = { id: `folder_${Date.now()}`, name, meetingIds: [] };
      setFolders(prev => [...prev, newFolder]);
  };
  
  const updateFolder = (id: string, name: string) => {
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  };

  const deleteFolder = (id: string) => {
      setFolders(prev => prev.filter(f => f.id !== id));
      // Move meetings to root
      setMeetings(prev => prev.map(m => m.folderId === id ? { ...m, folderId: undefined } : m));
      if (selectedFolderId === id) setSelectedFolderId(null);
  };

  const moveMeetingToFolder = (id: string, folderId: string | null) => {
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, folderId: folderId || undefined } : m));
      if (folderId) {
          setFolders(prev => prev.map(f => {
              if (f.id === folderId) return { ...f, meetingIds: [...f.meetingIds, id] };
              return { ...f, meetingIds: f.meetingIds.filter(mid => mid !== id) };
          }));
      } else {
          setFolders(prev => prev.map(f => ({ ...f, meetingIds: f.meetingIds.filter(mid => mid !== id) })));
      }
  };

  // Template Logic
  const addTemplate = (t: Template) => setTemplates(prev => [t, ...prev]);
  const updateTemplate = (id: string, u: Partial<Template>) => setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...u } : t));
  const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));
  const toggleStarTemplate = (id: string) => setTemplates(prev => prev.map(t => t.id === id ? { ...t, isStarred: !t.isStarred } : t));

  // Voiceprint & Hotword
  const addVoiceprint = (name: string, file?: Blob) => {
      setVoiceprints(prev => [...prev, { id: `vp_${Date.now()}`, name, createdAt: new Date() }]);
  };
  const updateVoiceprint = (id: string, name?: string, file?: Blob) => {
      setVoiceprints(prev => prev.map(v => v.id === id ? { ...v, name: name || v.name } : v));
  };
  const deleteVoiceprint = (id: string) => setVoiceprints(prev => prev.filter(v => v.id !== id));

  const addHotword = (word: string, category: string) => setHotwords(prev => [...prev, { id: `hw_${Date.now()}`, word, category, createdAt: new Date() }]);
  const updateHotword = (id: string, word: string, category: string) => setHotwords(prev => prev.map(h => h.id === id ? { ...h, word, category } : h));
  const deleteHotword = (id: string) => setHotwords(prev => prev.filter(h => h.id !== id));

  // Recycle Bin
  const restoreMeeting = (id: string) => {
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, deletedAt: undefined } : m));
  };
  const permanentDeleteMeeting = (id: string) => {
      setMeetings(prev => prev.filter(m => m.id !== id));
  };
  const emptyRecycleBin = () => {
      setMeetings(prev => prev.filter(m => !m.deletedAt));
  };

  // Misc
  const toggleStarMeeting = (id: string) => updateMeeting(id, { isStarred: !meetings.find(m => m.id === id)?.isStarred });
  const duplicateMeeting = (id: string) => {
      const original = meetings.find(m => m.id === id);
      if (original) {
          const copy = { ...original, id: `${original.id}_copy_${Date.now()}`, name: `${original.name} (副本)`, uploadDate: new Date() };
          setMeetings(prev => [copy, ...prev]);
      }
  };
  const retryProcessMeeting = (id: string) => {
      const m = meetings.find(m => m.id === id);
      if (m && m.file) {
          createMeeting(m.file, m.trimStart, m.trimEnd, 'upload');
      }
  };
  const updateUserName = setUserName;

  return {
    meetings: activeMeetings,
    deletedMeetings: recycledMeetings,
    folders,
    templates,
    voiceprints,
    hotwords,
    view,
    activeMeeting,
    shareConfig,
    userId,
    userName,
    isLoading,
    selectedFolderId,
    searchQuery,
    
    login,
    logout,
    setView,
    setShareConfig,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    accessMeeting,
    
    addFolder,
    updateFolder,
    deleteFolder,
    moveMeetingToFolder,
    setSelectedFolderId,
    
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleStarTemplate,
    
    toggleStarMeeting,
    duplicateMeeting,
    retryProcessMeeting,
    
    addVoiceprint,
    updateVoiceprint,
    deleteVoiceprint,
    
    addHotword,
    updateHotword,
    deleteHotword,
    
    restoreMeeting,
    permanentDeleteMeeting,
    emptyRecycleBin,
    updateUserName,
    setSearchQuery
  };
};
