
import React from 'react';
import { Template } from '../types';
import { HardwareFile } from '../hooks/useHardwareSync';
import { UploadPreviewModal } from './modals/meeting/UploadPreviewModal';
import { WebRecorderModal } from './modals/meeting/WebRecorderModal';
import { HardwareSyncModal } from './modals/hardware/HardwareSyncModal';
import { TemplateDetailModal } from './modals/TemplateModals';

interface GlobalModalsProps {
  pendingFile: File | null;
  onConfirmUpload: (file: File, trimStart: number, trimEnd: number) => void;
  onCancelUpload: () => void;
  
  isWebRecorderOpen: boolean;
  onSaveRecording: (file: File) => void;
  onCloseWebRecorder: () => void;
  
  isHardwareModalOpen: boolean;
  hardwareConnectionState: 'idle' | 'searching' | 'connected' | 'syncing' | 'disconnected';
  deviceFiles: HardwareFile[];
  deviceStatus?: { battery: number; version: string }; // New prop
  transferProgress?: number; // New prop
  onToggleHardwareFile: (id: string) => void;
  onSyncHardware: () => void;
  onCloseHardwareModal: () => void;

  activeHomeTemplate: Template | null;
  templateCategories: string[];
  onSaveTemplate: (id: string, updates: Partial<Template>) => void;
  onDeleteTemplate: (id: string) => void;
  onCloseTemplateModal: () => void;
}

export const GlobalModals: React.FC<GlobalModalsProps> = ({
  pendingFile, onConfirmUpload, onCancelUpload,
  isWebRecorderOpen, onSaveRecording, onCloseWebRecorder,
  isHardwareModalOpen, hardwareConnectionState, deviceFiles, deviceStatus, transferProgress, onToggleHardwareFile, onSyncHardware, onCloseHardwareModal,
  activeHomeTemplate, templateCategories, onSaveTemplate, onDeleteTemplate, onCloseTemplateModal
}) => {
  return (
    <>
      {pendingFile && (
        <UploadPreviewModal 
          file={pendingFile}
          onConfirm={onConfirmUpload}
          onCancel={onCancelUpload}
        />
      )}

      {isWebRecorderOpen && (
        <WebRecorderModal 
          onConfirm={onSaveRecording}
          onCancel={onCloseWebRecorder}
        />
      )}

      {isHardwareModalOpen && (
        <HardwareSyncModal 
          connectionState={hardwareConnectionState}
          files={deviceFiles}
          deviceStatus={deviceStatus}
          transferProgress={transferProgress}
          onToggleFile={onToggleHardwareFile}
          onSync={onSyncHardware}
          onClose={onCloseHardwareModal}
        />
      )}

      {activeHomeTemplate && (
        <TemplateDetailModal 
          template={activeHomeTemplate}
          categories={templateCategories}
          onSave={onSaveTemplate}
          onDelete={onDeleteTemplate}
          onClose={onCloseTemplateModal}
        />
      )}
    </>
  );
};
