
import { useState, useCallback } from 'react';
import { MeetingFile } from '../types';

export interface HardwareFile {
  id: string;
  name: string;
  size: string;
  duration: string;
  date: string;
  selected: boolean;
}

// 模拟硬件设备上的文件
const MOCK_DEVICE_FILES: HardwareFile[] = [
  { id: 'hw_1', name: '20231024_产品研讨会.wav', size: '14.2 MB', duration: '45:10', date: '2023-10-24 14:00', selected: false },
  { id: 'hw_2', name: '20231025_客户访谈_John.wav', size: '8.5 MB', duration: '22:15', date: '2023-10-25 09:30', selected: false },
  { id: 'hw_3', name: '20231025_团队周会.wav', size: '25.1 MB', duration: '01:12:00', date: '2023-10-25 16:00', selected: true },
];

export const useHardwareSync = (
  onCreateMeeting: (file: File) => void,
  onSyncComplete: () => void
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<'idle' | 'searching' | 'connected' | 'syncing'>('idle');
  const [deviceFiles, setDeviceFiles] = useState<HardwareFile[]>([]);
  
  const openSyncModal = useCallback(() => {
    setIsModalOpen(true);
    setConnectionState('searching');
    setDeviceFiles([]);

    // 模拟搜索设备过程
    setTimeout(() => {
      setConnectionState('connected');
      setDeviceFiles(MOCK_DEVICE_FILES);
    }, 2000);
  }, []);

  const closeSyncModal = useCallback(() => {
    setIsModalOpen(false);
    setConnectionState('idle');
  }, []);

  const toggleFileSelection = useCallback((id: string) => {
    setDeviceFiles(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  }, []);

  const handleSync = useCallback(async () => {
    const filesToSync = deviceFiles.filter(f => f.selected);
    if (filesToSync.length === 0) return;

    setConnectionState('syncing');

    // 模拟从硬件传输文件
    for (const fileData of filesToSync) {
      await new Promise(resolve => setTimeout(resolve, 800)); // 模拟传输延迟
      // 创建模拟的 File 对象
      const mockFile = new File(
        ["mock audio content"], 
        fileData.name, 
        { type: "audio/wav" }
      );
      onCreateMeeting(mockFile);
    }

    setTimeout(() => {
      setConnectionState('idle');
      setIsModalOpen(false);
      onSyncComplete();
    }, 500);
  }, [deviceFiles, onCreateMeeting, onSyncComplete]);

  return {
    isModalOpen,
    connectionState,
    deviceFiles,
    openSyncModal,
    closeSyncModal,
    toggleFileSelection,
    handleSync
  };
};
