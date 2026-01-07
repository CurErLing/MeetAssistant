
import { useState, useRef } from 'react';
import { useHardwareSync } from './useHardwareSync';

export const useGlobalState = (
  createMeeting: (file: File, trimStart?: number, trimEnd?: number) => void,
  onSyncComplete: () => void
) => {
  // Web Recorder & File Input State
  const [isWebRecorderOpen, setIsWebRecorderOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleTriggerUpload = () => fileInputRef.current?.click();
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPendingFile(e.target.files[0]);
    }
    e.target.value = ''; // Reset input
  };
  
  const handleConfirmUpload = (file: File, trimStart: number, trimEnd: number) => { 
    if (file) { 
      createMeeting(file, trimStart, trimEnd); 
      setPendingFile(null);
      onSyncComplete();
    } 
  };

  const handleCancelUpload = () => setPendingFile(null);

  const handleSaveRecording = (file: File) => {
    createMeeting(file);
    setIsWebRecorderOpen(false);
    onSyncComplete();
  };

  // Hardware Sync Hook
  const hardware = useHardwareSync(createMeeting, onSyncComplete);

  return {
    fileInputRef,
    handleTriggerUpload,
    handleFileInputChange,
    pendingFile,
    handleConfirmUpload,
    handleCancelUpload,
    isWebRecorderOpen,
    setIsWebRecorderOpen,
    handleSaveRecording,
    hardware
  };
};
