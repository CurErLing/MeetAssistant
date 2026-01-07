
import React from 'react';
import { Speaker, VoiceprintProfile, MeetingFile, Template, ShareConfig } from '../../../types';
import { SpeakerListModal, EditSpeakerModal, VoiceprintPickerModal, VoiceprintRecorderModal } from '../../modals/SpeakerModals';
import { ShareModal } from '../../modals/meeting/ShareModal';

interface MeetingModalsProps {
  // Speaker List Modal
  isSpeakerListOpen: boolean;
  onCloseSpeakerList: () => void;
  onEditSpeaker: (id: string) => void;
  
  // Edit Speaker Modal
  editingSpeakerId: string | null;
  speakers: Record<string, Speaker>;
  onCloseEditSpeaker: () => void;
  onUpdateSpeakerName: (id: string, name: string) => void;
  onOpenVoiceprintPicker: () => void;
  onOpenVoiceprintRecorder: (name: string) => void;

  // Voiceprint Picker Modal
  isVoiceprintPickerOpen: boolean;
  voiceprints: VoiceprintProfile[];
  onSelectVoiceprint: (vp: VoiceprintProfile) => void;
  onCloseVoiceprintPicker: () => void;

  // Voiceprint Recorder Modal
  isVoiceprintRecorderOpen: boolean;
  initialVoiceprintName: string;
  onSaveVoiceprint: (name: string) => void;
  onCloseVoiceprintRecorder: () => void;

  // Share Modal
  isShareModalOpen: boolean;
  meeting: MeetingFile;
  templates: Template[];
  onPreviewShare: (config: ShareConfig) => void;
  onCloseShare: () => void;
}

export const MeetingModals: React.FC<MeetingModalsProps> = (props) => {
  const {
    isSpeakerListOpen, onCloseSpeakerList, onEditSpeaker,
    editingSpeakerId, speakers, onCloseEditSpeaker, onUpdateSpeakerName, onOpenVoiceprintPicker, onOpenVoiceprintRecorder,
    isVoiceprintPickerOpen, voiceprints, onSelectVoiceprint, onCloseVoiceprintPicker,
    isVoiceprintRecorderOpen, initialVoiceprintName, onSaveVoiceprint, onCloseVoiceprintRecorder,
    isShareModalOpen, meeting, templates, onPreviewShare, onCloseShare
  } = props;

  return (
    <>
      {isSpeakerListOpen && (
        <SpeakerListModal 
          speakers={speakers} 
          onEditSpeaker={onEditSpeaker} 
          onClose={onCloseSpeakerList} 
        />
      )}
      {editingSpeakerId && speakers[editingSpeakerId] && (
        <EditSpeakerModal 
          speaker={speakers[editingSpeakerId]} 
          onSave={(n) => onUpdateSpeakerName(editingSpeakerId, n)} 
          onOpenVoiceprintPicker={onOpenVoiceprintPicker} 
          onOpenVoiceprintRecorder={onOpenVoiceprintRecorder}
          onClose={onCloseEditSpeaker} 
        />
      )}
      {isVoiceprintPickerOpen && (
        <VoiceprintPickerModal 
          voiceprints={voiceprints} 
          onSelect={onSelectVoiceprint} 
          onClose={onCloseVoiceprintPicker} 
        />
      )}
      {isVoiceprintRecorderOpen && (
        <VoiceprintRecorderModal 
          initialName={initialVoiceprintName}
          onSave={onSaveVoiceprint}
          onClose={onCloseVoiceprintRecorder}
        />
      )}
      {isShareModalOpen && (
        <ShareModal 
          meeting={meeting} 
          templates={templates} 
          onClose={onCloseShare} 
          onPreview={onPreviewShare} 
        />
      )}
    </>
  );
};
