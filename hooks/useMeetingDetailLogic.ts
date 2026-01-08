
import { useState, useEffect } from 'react';
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

  // 当切换会议 ID 时，重置所有临时状态
  useEffect(() => {
    setActiveTab('transcript');
    setCurrentTime(0);
    setIsSelectingTemplate(false);
    setReplacingAnalysisId(null);
    setEditingAnalysisId(null);
  }, [meeting.id]);

  // --- 核心辅助函数：安全更新发言人 ---
  // 之前出现 "Cannot read properties of undefined" 的主要原因就是在更新时直接访问了不存在的 speaker 对象
  const updateSpeakerSafe = (speakerId: string, updates: Partial<Speaker>) => {
    // 确保 speakers 对象存在
    const currentSpeakers = meeting.speakers || {};
    const existingSpeaker = currentSpeakers[speakerId];
    
    if (existingSpeaker) {
      // 情况 1: 发言人已存在，进行合并更新
      onUpdate({ 
        speakers: { 
          ...currentSpeakers, 
          [speakerId]: { ...existingSpeaker, ...updates } 
        } 
      });
    } else {
      // 情况 2: 发言人不存在（异常情况），创建一个默认对象，防止数据损坏
      // 这是防御性编程的关键步骤
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

  // 关联已有的声纹档案到当前发言人
  const linkVoiceprint = (vp: VoiceprintProfile) => {
    if (isReadOnly) return;
    if (editingSpeakerId) {
      updateSpeakerSafe(editingSpeakerId, { name: vp.name, status: SpeakerStatus.REGISTERED });
    }
    setIsVoiceprintPickerOpen(false);
  };

  // 注册新声纹并立即关联
  const registerAndLinkVoiceprint = (newName: string) => {
    if (isReadOnly) return;
    onRegisterVoiceprint(newName); // 调用全局 Store 的注册方法
    if (editingSpeakerId) {
       updateSpeakerSafe(editingSpeakerId, { name: newName, status: SpeakerStatus.REGISTERED });
    }
    setIsVoiceprintRecorderOpen(false);
    setEditingSpeakerId(null);
    setVoiceprintInitialName("");
  };

  // --- 核心业务：执行 AI 分析生成 ---
  const runAnalysisGeneration = async (analysisId: string, templateId: string, currentAnalyses: AnalysisResult[]) => {
    if (isReadOnly) return;
    
    // 1. 乐观更新 (Optimistic Update)：先在 UI 上显示“处理中”状态，提升响应速度感知
    const updatedAnalyses = currentAnalyses.map(a => 
      a.id === analysisId ? { ...a, templateId, status: 'processing' as const, content: '' } : a
    );
    onUpdate({ analyses: updatedAnalyses });

    try {
      const activeTemplate = templates.find(t => t.id === templateId) || templates[0];
      if (!meeting.transcript) throw new Error("No transcript found");

      // 2. 调用 Gemini 服务 (耗时操作)
      // 注意：这里传入了 meeting.speakers || {} 以防 speakers 未定义
      const summary = await generateMeetingSummary(meeting.transcript, meeting.speakers || {}, activeTemplate);
      
      // 3. 成功回调：更新内容并将状态设为 'ready'
      onUpdate({
        analyses: updatedAnalyses.map(a => 
          a.id === analysisId ? { ...a, content: summary, status: 'ready' as const } : a
        )
      });
    } catch (e) {
      // 4. 错误处理：将状态设为 'error'
      console.error("Analysis generation failed", e);
      onUpdate({
        analyses: updatedAnalyses.map(a => a.id === analysisId ? { ...a, status: 'error' as const } : a)
      });
    }
  };

  // 处理模板选择后的逻辑（新建分析或替换现有分析）
  const handleTemplateSelected = (templateId: string) => {
    if (isReadOnly) return;
    const currentAnalyses = meeting.analyses || [];

    if (replacingAnalysisId) {
      // 替换现有分析视图
      runAnalysisGeneration(replacingAnalysisId, templateId, currentAnalyses);
      setReplacingAnalysisId(null);
    } else {
      // 创建新分析视图
      const analysisId = `analysis_${Date.now()}`;
      const newAnalysis: AnalysisResult = { id: analysisId, templateId, content: "", status: 'processing' };
      const newList = [...currentAnalyses, newAnalysis];
      
      onUpdate({ analyses: newList });
      setActiveTab(analysisId); // 自动切换到新 Tab
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
    if (activeTab === id) setActiveTab('transcript'); // 如果删除了当前 Tab，回退到转写页
  };

  const updateTranscript = (updatedTranscript: TranscriptSegment[]) => {
     if (isReadOnly) return;
     onUpdate({ transcript: updatedTranscript });
  };

  const handleDurationChange = (d: number) => {
      // 只有当时长显著变化时才更新，防止浮点数精度导致的无限循环更新
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
