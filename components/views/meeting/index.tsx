
import React from 'react';
import { MeetingFile, Template, VoiceprintProfile, ShareConfig } from '../../../types';
import { AudioEditor } from '../../audio-editor'; 
import { SideMenu } from './SideMenu';
import { DetailHeader } from './DetailHeader';
import { DetailTabs } from './DetailTabs';
import { MeetingContent } from './MeetingContent';
import { MeetingModals } from './MeetingModals';
import { useMeetingDetailLogic } from '../../../hooks/useMeetingDetailLogic';

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
  
  // Use Custom Hook for Logic
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

  const currentAnalysis = meeting.analyses?.find(a => a.id === activeTab);
  const showPlayer = !isSelectingTemplate && activeTab === 'transcript';

  return (
    <div className="flex h-full animate-fade-in w-full overflow-hidden bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-slate-200">
      
      {/* 1. Side Menu */}
      <SideMenu 
        meetings={meetingList} 
        activeMeetingId={meeting.id} 
        onSelectMeeting={onSelectMeeting || (() => {})} 
        onBack={onBack}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative min-w-0">
        
        <DetailHeader 
          title={meeting.name}
          onBack={onBack}
          onUpdateTitle={actions.updateMeetingTitle}
          onShare={() => setters.setIsShareModalOpen(true)}
          onExport={() => alert("导出功能开发中...")}
          isSelectingTemplate={isSelectingTemplate}
          onCancelSelectTemplate={() => {
            setters.setIsSelectingTemplate(false);
            setters.setReplacingAnalysisId(null);
          }}
          readOnly={isReadOnly}
        />

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

      {!isReadOnly && (
        <MeetingModals 
          isSpeakerListOpen={isSpeakerListOpen}
          onCloseSpeakerList={() => setters.setIsSpeakerListOpen(false)}
          onEditSpeaker={(id) => setters.setEditingSpeakerId(id)}
          
          editingSpeakerId={editingSpeakerId}
          speakers={meeting.speakers}
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
          initialVoiceprintName={voiceprintInitialName || (editingSpeakerId ? meeting.speakers[editingSpeakerId]?.name || "" : "")}
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
