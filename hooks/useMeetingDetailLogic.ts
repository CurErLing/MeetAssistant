
import { useState, useEffect } from 'react';
import { MeetingFile, SpeakerStatus, Template, AnalysisResult, VoiceprintProfile, TranscriptSegment, Speaker } from '../types';
import { generateMeetingSummary } from '../services/geminiService';

interface UseMeetingDetailLogicProps {
  meeting: MeetingFile;
  templates: Template[];
  onUpdate: (updates: Partial<MeetingFile>) => void;
  onRegisterVoiceprint: (name: string) => void;
}

export const useMeetingDetailLogic = ({
  meeting,
  templates,
  onUpdate,
  onRegisterVoiceprint
}: UseMeetingDetailLogicProps) => {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<string>('transcript');
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);
  const [isSelectingTemplate, setIsSelectingTemplate] = useState(false);
  
  // --- Analysis State ---
  const [replacingAnalysisId, setReplacingAnalysisId] = useState<string | null>(null);
  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);

  // --- Modal State ---
  const [isSpeakerListOpen, setIsSpeakerListOpen] = useState(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [isVoiceprintPickerOpen, setIsVoiceprintPickerOpen] = useState(false);
  const [isVoiceprintRecorderOpen, setIsVoiceprintRecorderOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [voiceprintInitialName, setVoiceprintInitialName] = useState("");

  const isReadOnly = meeting.isReadOnly === true;

  // Reset state when meeting ID changes
  useEffect(() => {
    setActiveTab('transcript');
    setCurrentTime(0);
    setIsSelectingTemplate(false);
    setReplacingAnalysisId(null);
    setEditingAnalysisId(null);
  }, [meeting.id]);

  // --- Helper: Safely update speaker ---
  const updateSpeakerSafe = (speakerId: string, updates: Partial<Speaker>) => {
    const existingSpeaker = meeting.speakers[speakerId];
    
    if (existingSpeaker) {
      onUpdate({ 
        speakers: { 
          ...meeting.speakers, 
          [speakerId]: { ...existingSpeaker, ...updates } 
        } 
      });
    } else {
      // Create a default speaker if not exists to prevent corrupt data
      const newSpeaker: Speaker = {
        id: speakerId,
        name: updates.name || "未知",
        defaultLabel: "发言人",
        status: updates.status || SpeakerStatus.IDENTIFIED,
        color: updates.color || 'text-slate-700',
        ...updates
      };
      
      onUpdate({ 
        speakers: { 
          ...meeting.speakers, 
          [speakerId]: newSpeaker
        } 
      });
    }
  };

  // --- Actions ---

  const updateMeetingTitle = (newName: string) => {
    if (isReadOnly) return;
    onUpdate({ name: newName });
  };

  const updateSpeakerName = (id: string, newName: string) => {
    if (isReadOnly) return;
    updateSpeakerSafe(id, { name: newName });
    setEditingSpeakerId(null);
  };

  const linkVoiceprint = (vp: VoiceprintProfile) => {
    if (isReadOnly) return;
    if (editingSpeakerId) {
      updateSpeakerSafe(editingSpeakerId, { name: vp.name, status: SpeakerStatus.REGISTERED });
    }
    setIsVoiceprintPickerOpen(false);
  };

  const registerAndLinkVoiceprint = (newName: string) => {
    if (isReadOnly) return;
    onRegisterVoiceprint(newName);
    if (editingSpeakerId) {
       updateSpeakerSafe(editingSpeakerId, { name: newName, status: SpeakerStatus.REGISTERED });
    }
    setIsVoiceprintRecorderOpen(false);
    setEditingSpeakerId(null);
    setVoiceprintInitialName("");
  };

  const runAnalysisGeneration = async (analysisId: string, templateId: string, currentAnalyses: AnalysisResult[]) => {
    if (isReadOnly) return;
    
    // 1. Optimistic Update
    const updatedAnalyses = currentAnalyses.map(a => 
      a.id === analysisId ? { ...a, templateId, status: 'processing' as const, content: '' } : a
    );
    onUpdate({ analyses: updatedAnalyses });

    try {
      const activeTemplate = templates.find(t => t.id === templateId) || templates[0];
      if (!meeting.transcript) throw new Error("No transcript found");

      // 2. Call API
      const summary = await generateMeetingSummary(meeting.transcript, meeting.speakers, activeTemplate);
      
      // 3. Success Update
      onUpdate({
        analyses: updatedAnalyses.map(a => 
          a.id === analysisId ? { ...a, content: summary, status: 'ready' as const } : a
        )
      });
    } catch (e) {
      // 4. Error Update
      onUpdate({
        analyses: updatedAnalyses.map(a => a.id === analysisId ? { ...a, status: 'error' as const } : a)
      });
    }
  };

  const handleTemplateSelected = (templateId: string) => {
    if (isReadOnly) return;
    const currentAnalyses = meeting.analyses || [];

    if (replacingAnalysisId) {
      runAnalysisGeneration(replacingAnalysisId, templateId, currentAnalyses);
      setReplacingAnalysisId(null);
    } else {
      const analysisId = `analysis_${Date.now()}`;
      const newAnalysis: AnalysisResult = { id: analysisId, templateId, content: "", status: 'processing' };
      const newList = [...currentAnalyses, newAnalysis];
      
      onUpdate({ analyses: newList });
      setActiveTab(analysisId);
      runAnalysisGeneration(analysisId, templateId, newList);
    }
    setIsSelectingTemplate(false);
  };

  const regenerateAnalysis = (analysisId: string) => {
    if (isReadOnly) return;
    const analysis = meeting.analyses?.find(a => a.id === analysisId);
    if (analysis) {
      runAnalysisGeneration(analysisId, analysis.templateId, meeting.analyses || []);
    }
  };

  const updateAnalysisContent = (id: string, updates: Partial<AnalysisResult>) => {
    if (isReadOnly) return;
    onUpdate({
      analyses: (meeting.analyses || []).map(a => a.id === id ? { ...a, ...updates } : a)
    });
  };

  const deleteAnalysis = (id: string) => {
    if (isReadOnly) return;
    onUpdate({ analyses: (meeting.analyses || []).filter(a => a.id !== id) });
    if (activeTab === id) setActiveTab('transcript');
  };

  const updateTranscript = (updatedTranscript: TranscriptSegment[]) => {
     if (isReadOnly) return;
     onUpdate({ transcript: updatedTranscript });
  };

  const handleDurationChange = (d: number) => {
      // Only update if significantly different to avoid loops
      if (Math.abs(meeting.duration - d) > 1) {
          onUpdate({ duration: d });
      }
  };

  return {
    state: {
      activeTab,
      currentTime,
      seekTarget,
      isSelectingTemplate,
      replacingAnalysisId,
      editingAnalysisId,
      isSpeakerListOpen,
      editingSpeakerId,
      isVoiceprintPickerOpen,
      isVoiceprintRecorderOpen,
      isShareModalOpen,
      voiceprintInitialName,
      isReadOnly
    },
    setters: {
      setActiveTab,
      setCurrentTime,
      setSeekTarget,
      setIsSelectingTemplate,
      setReplacingAnalysisId,
      setEditingAnalysisId,
      setIsSpeakerListOpen,
      setEditingSpeakerId,
      setIsVoiceprintPickerOpen,
      setIsVoiceprintRecorderOpen,
      setIsShareModalOpen,
      setVoiceprintInitialName
    },
    actions: {
      updateMeetingTitle,
      updateSpeakerName,
      linkVoiceprint,
      registerAndLinkVoiceprint,
      handleTemplateSelected,
      regenerateAnalysis,
      updateAnalysisContent,
      deleteAnalysis,
      updateTranscript,
      handleDurationChange
    }
  };
};
