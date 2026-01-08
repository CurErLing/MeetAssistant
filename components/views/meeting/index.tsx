
import React from 'react';
import { MeetingFile, Template, VoiceprintProfile, ShareConfig } from '../../../types';
import { AudioEditor } from '../../audio-editor'; 
import { SideMenu } from './SideMenu';
import { DetailHeader } from './DetailHeader';
import { DetailTabs } from './DetailTabs';
import { MeetingContent } from './MeetingContent';
import { MeetingModals } from './MeetingModals';
import { useMeetingDetailLogic } from '../../../hooks/useMeetingDetailLogic';
import { useToast } from '../../common/Toast';

/**
 * 会议详情页主组件
 * 包含：侧边栏、顶部导航、音频播放器、内容区域（转写/分析）以及各类弹窗
 */
export const MeetingDetailView = ({ 
  meeting, 
  meetingList = [], 
  onSelectMeeting,
  templates = [], 
  voiceprints = [], 
  onUpdate, 
  onBack, 
  onRegisterVoiceprint, 
  onPreviewShare
}: { 
  meeting: MeetingFile, 
  meetingList?: MeetingFile[], 
  onSelectMeeting?: (id: string) => void,
  templates?: Template[], 
  voiceprints?: VoiceprintProfile[], 
  onUpdate: (updates: Partial<MeetingFile>) => void,
  onBack: () => void, 
  onRegisterVoiceprint: (name: string) => void, 
  onPreviewShare: (config: ShareConfig) => void
}) => {
  const { info } = useToast();
  
  // 使用自定义 Hook 提取业务逻辑，保持视图层整洁
  const { state, setters, actions } = useMeetingDetailLogic({
    meeting,
    templates,
    onUpdate,
    onRegisterVoiceprint
  });

  const { 
    activeTab, currentTime, seekTarget, isSelectingTemplate, editingAnalysisId, 
    isSpeakerListOpen, editingSpeakerId, isVoiceprintPickerOpen, isVoiceprintRecorderOpen, isShareModalOpen, voiceprintInitialName, isReadOnly 
  } = state;

  // 计算当前显示的分析结果（如果是 'transcript' 模式则为 undefined）
  const currentAnalysis = meeting.analyses?.find(a => a.id === activeTab);
  
  // 仅在查看转写时显示音频播放器，选择模板时隐藏
  const showPlayer = !isSelectingTemplate && activeTab === 'transcript';

  // 辅助函数：安全地获取当前编辑的发言人姓名
  const getEditingSpeakerName = () => {
    if (!editingSpeakerId || !meeting.speakers) return "";
    return meeting.speakers[editingSpeakerId]?.name || "";
  };

  return (
    <div className="flex h-full animate-fade-in w-full overflow-hidden bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-slate-200">
      
      {/* 1. 左侧：会议列表侧边栏 (Side Menu) */}
      <SideMenu 
        meetings={meetingList} 
        activeMeetingId={meeting.id} 
        onSelectMeeting={onSelectMeeting || (() => {})} 
        onBack={onBack}
      />

      {/* 2. 右侧：主要内容区域 */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative min-w-0">
        
        {/* 顶部标题栏 */}
        <DetailHeader 
          title={meeting.name}
          onBack={onBack}
          onUpdateTitle={actions.updateMeetingTitle}
          onShare={() => setters.setIsShareModalOpen(true)}
          onExport={() => info("导出功能开发中...")}
          isSelectingTemplate={isSelectingTemplate}
          onCancelSelectTemplate={() => {
            setters.setIsSelectingTemplate(false);
            setters.setReplacingAnalysisId(null);
          }}
          readOnly={isReadOnly}
        />

        {/* 标签页导航 (Tabs) */}
        <DetailTabs 
          activeTab={activeTab}
          analyses={meeting.analyses || []}
          templates={templates}
          isSelectingTemplate={isSelectingTemplate}
          onTabChange={(tabId) => { 
            setters.setActiveTab(tabId); 
            setters.setIsSelectingTemplate(false); 
            setters.setReplacingAnalysisId(null);
            setters.setEditingAnalysisId(null); 
          }}
          onToggleTemplateSelector={() => setters.setIsSelectingTemplate(!isSelectingTemplate)}
          onRegenerateAnalysis={actions.regenerateAnalysis}
          onChangeTemplate={(id) => {
             setters.setReplacingAnalysisId(id);
             setters.setIsSelectingTemplate(true);
          }}
          onEditAnalysis={setters.setEditingAnalysisId}
          onDeleteAnalysis={actions.deleteAnalysis}
          readOnly={isReadOnly}
        />

        {/* 音频播放器 (Audio Editor) - 仅在转写页显示 */}
        {showPlayer && (
          <div className="flex-shrink-0 bg-white z-10">
              <AudioEditor 
                 url={meeting.url}
                 duration={meeting.duration}
                 trimStart={0} 
                 trimEnd={meeting.duration} 
                 seekTo={seekTarget} 
                 onTimeUpdate={setters.setCurrentTime} 
                 onDurationChange={actions.handleDurationChange}
                 compact={true}
                 className="rounded-none border-x-0 border-t-0 border-b border-slate-100 shadow-none"
                 readOnly={isReadOnly}
              />
          </div>
        )}

        {/* 内容滚动区域：转写列表 或 分析结果 */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
           <MeetingContent 
              isSelectingTemplate={isSelectingTemplate}
              activeTab={activeTab}
              meeting={meeting}
              templates={templates}
              currentTime={currentTime}
              currentAnalysis={currentAnalysis}
              editingAnalysisId={editingAnalysisId}
              onSelectTemplate={actions.handleTemplateSelected}
              onCloseTemplatePicker={() => {
                setters.setIsSelectingTemplate(false);
                setters.setReplacingAnalysisId(null);
              }}
              onUpdateTranscript={actions.updateTranscript}
              onSpeakerClick={(id) => {
                 if (!isReadOnly) setters.setEditingSpeakerId(id);
              }}
              onSeek={(time) => setters.setSeekTarget(time)}
              onManageSpeakers={() => {
                 if (!isReadOnly) setters.setIsSpeakerListOpen(true);
              }}
              onUpdateAnalysis={actions.updateAnalysisContent}
              onCancelEdit={() => setters.setEditingAnalysisId(null)}
              onDeleteAnalysis={actions.deleteAnalysis}
              onBackToTranscript={() => setters.setActiveTab('transcript')}
              readOnly={isReadOnly}
           />
        </div>
      </div>

      {/* 全局弹窗层：发言人编辑、声纹录入、分享等 */}
      {!isReadOnly && (
        <MeetingModals 
          isSpeakerListOpen={isSpeakerListOpen}
          onCloseSpeakerList={() => setters.setIsSpeakerListOpen(false)}
          onEditSpeaker={(id) => setters.setEditingSpeakerId(id)}
          
          editingSpeakerId={editingSpeakerId}
          speakers={meeting.speakers || {}} // 确保传入空对象防止崩溃
          onCloseEditSpeaker={() => setters.setEditingSpeakerId(null)}
          onUpdateSpeakerName={actions.updateSpeakerName}
          onOpenVoiceprintPicker={() => setters.setIsVoiceprintPickerOpen(true)}
          onOpenVoiceprintRecorder={(name) => {
             setters.setVoiceprintInitialName(name);
             setters.setIsVoiceprintRecorderOpen(true);
          }}
          
          isVoiceprintPickerOpen={isVoiceprintPickerOpen}
          voiceprints={voiceprints}
          onSelectVoiceprint={actions.linkVoiceprint}
          onCloseVoiceprintPicker={() => setters.setIsVoiceprintPickerOpen(false)}
          
          isVoiceprintRecorderOpen={isVoiceprintRecorderOpen}
          initialVoiceprintName={voiceprintInitialName || getEditingSpeakerName()}
          onSaveVoiceprint={actions.registerAndLinkVoiceprint}
          onCloseVoiceprintRecorder={() => {
            setters.setIsVoiceprintRecorderOpen(false);
            setters.setVoiceprintInitialName("");
          }}
          
          isShareModalOpen={isShareModalOpen}
          meeting={meeting}
          templates={templates}
          onPreviewShare={onPreviewShare}
          onCloseShare={() => setters.setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};
