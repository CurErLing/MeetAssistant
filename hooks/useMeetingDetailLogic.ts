
import { useState, useEffect, useRef } from 'react';
import { MeetingFile, SpeakerStatus, Template, AnalysisResult, VoiceprintProfile, TranscriptSegment, Speaker } from '../types';
import { generateMeetingSummary } from '../services/geminiService';

interface UseMeetingDetailLogicProps {
  meeting: MeetingFile;
  templates: Template[];
  onUpdate: (updates: Partial<MeetingFile>) => void;
  onRegisterVoiceprint: (name: string) => void;
}

/**
 * 会议详情页的核心业务逻辑 Hook
 * 作用：将复杂的 UI 状态管理和数据处理逻辑从视图层剥离
 */
export const useMeetingDetailLogic = ({
  meeting,
  templates,
  onUpdate,
  onRegisterVoiceprint
}: UseMeetingDetailLogicProps) => {
  // --- UI 状态 ---
  const [activeTab, setActiveTab] = useState<string>('transcript'); // 当前选中的 Tab ('transcript' 或 analysisId)
  const [currentTime, setCurrentTime] = useState(0);                // 当前音频播放进度
  const [seekTarget, setSeekTarget] = useState<number | null>(null);// 音频跳转目标
  const [isSelectingTemplate, setIsSelectingTemplate] = useState(false); // 是否正在选择 AI 模板
  
  // --- AI 分析状态 ---
  const [replacingAnalysisId, setReplacingAnalysisId] = useState<string | null>(null); // 正在被替换的分析 ID
  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);     // 正在编辑的分析 ID

  // --- 弹窗/模态框状态 ---
  const [isSpeakerListOpen, setIsSpeakerListOpen] = useState(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [isVoiceprintPickerOpen, setIsVoiceprintPickerOpen] = useState(false);
  const [isVoiceprintRecorderOpen, setIsVoiceprintRecorderOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [voiceprintInitialName, setVoiceprintInitialName] = useState("");

  const isReadOnly = meeting.isReadOnly === true;

  // Use Ref to track latest meeting state for async operations to avoid closure staleness
  const meetingRef = useRef(meeting);
  useEffect(() => {
    meetingRef.current = meeting;
  }, [meeting]);

  // 当切换会议 ID 时，重置所有临时状态
  useEffect(() => {
    setActiveTab('transcript');
    setCurrentTime(0);
    setIsSelectingTemplate(false);
    setReplacingAnalysisId(null);
    setEditingAnalysisId(null);
  }, [meeting.id]);

  // --- 核心辅助函数：安全更新发言人 ---
  const updateSpeakerSafe = (speakerId: string, updates: Partial<Speaker>) => {
    const currentSpeakers = meeting.speakers || {};
    const existingSpeaker = currentSpeakers[speakerId];
    
    if (existingSpeaker) {
      onUpdate({ 
        speakers: { 
          ...currentSpeakers, 
          [speakerId]: { ...existingSpeaker, ...updates } 
        } 
      });
    } else {
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
          ...currentSpeakers, 
          [speakerId]: newSpeaker
        } 
      });
    }
  };

  // --- Actions (业务动作) ---

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

  // --- 核心业务：执行 AI 分析生成 (流式) ---
  const runAnalysisGeneration = async (analysisId: string, templateId: string) => {
    if (isReadOnly) return;
    
    // Get latest analyses list from Ref to ensure we don't overwrite concurrent changes
    const currentAnalyses = meetingRef.current.analyses || [];
    
    // 1. 初始状态：显示处理中，清空内容
    const initialUpdate = currentAnalyses.map(a => 
      a.id === analysisId ? { ...a, templateId, status: 'processing' as const, content: '' } : a
    );
    onUpdate({ analyses: initialUpdate });

    try {
      const activeTemplate = templates.find(t => t.id === templateId) || templates[0];
      if (!meeting.transcript) throw new Error("No transcript found");

      // 2. 调用 Gemini 服务 (流式回调)
      const finalSummary = await generateMeetingSummary(
        meeting.transcript, 
        meeting.speakers || {}, 
        activeTemplate,
        (partialText) => {
            // Stream Callback: Update content while keeping status as 'processing'
            // We reference meetingRef.current again to be safe
            const latestAnalyses = meetingRef.current.analyses || [];
            onUpdate({
                analyses: latestAnalyses.map(a => 
                    a.id === analysisId ? { ...a, content: partialText, status: 'processing' as const } : a
                )
            });
        }
      );
      
      // 3. 完成：更新最终内容并将状态设为 'ready'
      const finalAnalyses = meetingRef.current.analyses || [];
      onUpdate({
        analyses: finalAnalyses.map(a => 
          a.id === analysisId ? { ...a, content: finalSummary, status: 'ready' as const } : a
        )
      });
    } catch (e) {
      console.error("Analysis generation failed", e);
      const errorAnalyses = meetingRef.current.analyses || [];
      onUpdate({
        analyses: errorAnalyses.map(a => a.id === analysisId ? { ...a, status: 'error' as const } : a)
      });
    }
  };

  const handleTemplateSelected = (templateId: string) => {
    if (isReadOnly) return;
    const currentAnalyses = meeting.analyses || [];

    if (replacingAnalysisId) {
      // 替换现有分析视图
      runAnalysisGeneration(replacingAnalysisId, templateId);
      setReplacingAnalysisId(null);
    } else {
      // 创建新分析视图
      const analysisId = `analysis_${Date.now()}`;
      const newAnalysis: AnalysisResult = { id: analysisId, templateId, content: "", status: 'processing' };
      const newList = [...currentAnalyses, newAnalysis];
      
      onUpdate({ analyses: newList });
      setActiveTab(analysisId); 
      // Delay slightly to allow state to settle
      setTimeout(() => runAnalysisGeneration(analysisId, templateId), 0);
    }
    setIsSelectingTemplate(false);
  };

  const regenerateAnalysis = (analysisId: string) => {
    if (isReadOnly) return;
    const analysis = meeting.analyses?.find(a => a.id === analysisId);
    if (analysis) {
      runAnalysisGeneration(analysisId, analysis.templateId);
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
