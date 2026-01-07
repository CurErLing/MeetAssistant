
import { useState, useCallback, useEffect } from 'react';
import { bluetoothService, DeviceFileInfo } from '../services/ble/BluetoothService';
import { formatTime } from '../utils/formatUtils';

export interface HardwareFile {
  id: string;
  name: string;
  size: string;
  rawSize: number;
  duration: string; 
  date: string;
  selected: boolean;
}

export const useHardwareSync = (
  onCreateMeeting: (file: File) => void,
  onSyncComplete: () => void
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<'idle' | 'searching' | 'connected' | 'syncing' | 'disconnected'>('idle');
  const [deviceFiles, setDeviceFiles] = useState<HardwareFile[]>([]);
  
  // Initialize with capacity: null to ensure type consistency and reactivity
  const [deviceStatus, setDeviceStatus] = useState<{
    battery: number;
    version: string;
    capacity: { used: number; total: number } | null;
  }>({ battery: 0, version: '', capacity: null });
  
  const [transferProgress, setTransferProgress] = useState(0);
  
  // Listen to service state
  useEffect(() => {
    return bluetoothService.subscribeToState((state) => {
      setConnectionState(state);
      if (state === 'disconnected' && isModalOpen) {
        alert("设备已断开连接");
        setIsModalOpen(false);
      }
    });
  }, [isModalOpen]);

  const openSyncModal = useCallback(async () => {
    setIsModalOpen(true);
    await bluetoothService.connect();
    
    // Explicitly check connection state
    if (bluetoothService.isConnected) {
        bluetoothService.setStatusCallback((status) => {
            setDeviceStatus(prev => ({ ...prev, ...status }));
        });

        // 1. Fetch Device Info (Battery, Capacity, Version)
        // Await to ensure commands are sent before file list stream potentially hogs the channel
        await bluetoothService.getDeviceInfo();

        // 2. Fetch File List
        bluetoothService.fetchFileList((files) => {
            const mappedFiles = files.map((f, idx) => ({
                id: `hw_${idx}`,
                name: f.name,
                rawSize: f.size,
                size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
                // Use protocol duration if available, otherwise unknown
                duration: f.duration ? formatTime(f.duration) : '--:--', 
                date: new Date(f.time * 1000).toLocaleDateString() + ' ' + new Date(f.time * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                selected: false
            }));
            // Sort by date desc
            setDeviceFiles(mappedFiles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        });
    }
  }, []);

  const closeSyncModal = useCallback(() => {
    bluetoothService.disconnect();
    setIsModalOpen(false);
    setConnectionState('idle');
    setDeviceFiles([]);
  }, []);

  const toggleFileSelection = useCallback((id: string) => {
    setDeviceFiles(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  }, []);

  const handleSync = useCallback(async () => {
    const filesToSync = deviceFiles.filter(f => f.selected);
    if (filesToSync.length === 0) return;

    for (const fileData of filesToSync) {
      setTransferProgress(0);
      await new Promise<void>((resolve) => {
          bluetoothService.downloadFile(
              fileData.name, 
              fileData.rawSize,
              (pct) => setTransferProgress(pct),
              (file) => {
                  onCreateMeeting(file);
                  resolve();
              }
          );
      });
    }

    setTransferProgress(100);
    setTimeout(() => {
      onSyncComplete();
      closeSyncModal();
    }, 500);
  }, [deviceFiles, onCreateMeeting, onSyncComplete, closeSyncModal]);

  return {
    isModalOpen,
    connectionState,
    deviceFiles,
    deviceStatus,
    transferProgress,
    openSyncModal,
    closeSyncModal,
    toggleFileSelection,
    handleSync
  };
};
