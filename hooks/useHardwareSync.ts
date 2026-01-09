
import { useCallback, useEffect, useState, useRef } from 'react';
import { bluetoothService } from '../services/ble/BluetoothService';
import { formatTime } from '../utils/formatUtils';
import { useToast } from '../components/common/Toast';

export interface HardwareFile {
  id: string;
  name: string;
  rawName: Uint8Array;
  size: string;
  rawSize: number;
  duration: string; 
  date: string;
  selected: boolean;
}

export const useHardwareSync = (
  onCreateMeeting: (file: File, context: { isBatch: boolean }) => void,
  onSyncComplete: () => void
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<'idle' | 'searching' | 'connected' | 'syncing' | 'disconnected'>('idle');
  const [deviceFiles, setDeviceFiles] = useState<HardwareFile[]>([]);
  const { error, success, info } = useToast();
  
  // Initialize with capacity: null to ensure type consistency and reactivity
  const [deviceStatus, setDeviceStatus] = useState<{
    battery: number;
    version: string;
    capacity: { used: number; total: number } | null;
  }>({ battery: 0, version: '', capacity: null });
  
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferTime, setTransferTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  
  // Listen to service state
  useEffect(() => {
    return bluetoothService.subscribeToState((state) => {
      setConnectionState(state);
      if (state === 'disconnected' && isModalOpen) {
        error("设备已断开连接");
        setIsModalOpen(false);
        stopTimer();
      }
    });
  }, [isModalOpen, error]);

  const startTimer = () => {
    setTransferTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTransferTime(t => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const openSyncModal = useCallback(async () => {
    setIsModalOpen(true);
    setTransferTime(0);
    try {
        await bluetoothService.connect();
    } catch (e: any) {
        if (e && e.name === 'NotFoundError') {
            // User cancelled, just close modal silently
            setIsModalOpen(false);
            return;
        }
        error("连接设备失败: " + (e.message || "未知错误"));
        setIsModalOpen(false);
        return;
    }
    
    if (bluetoothService.isConnected) {
        bluetoothService.setStatusCallback((status) => {
            setDeviceStatus(prev => ({ ...prev, ...status }));
        });

        // 1. Fetch Device Info (Battery, Capacity, Version)
        // Await to ensure commands are sent before file list stream
        await bluetoothService.getDeviceInfo();

        // 2. Fetch File List
        bluetoothService.fetchFileList((files) => {
            const mappedFiles = files.map((f, idx) => ({
                id: `hw_${idx}`,
                name: f.name,
                rawName: f.rawName,
                rawSize: f.size,
                size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
                duration: f.duration ? formatTime(f.duration) : '--:--', 
                date: new Date(f.time * 1000).toLocaleDateString() + ' ' + new Date(f.time * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                selected: false
            }));
            // Sort by date desc
            setDeviceFiles(mappedFiles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        });
    }
  }, [error]);

  const closeSyncModal = useCallback(() => {
    stopTimer();
    bluetoothService.disconnect();
    setIsModalOpen(false);
    setConnectionState('idle');
    setDeviceFiles([]);
    setTransferTime(0);
  }, []);

  const toggleFileSelection = useCallback((id: string) => {
    setDeviceFiles(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  }, []);

  const handleSync = useCallback(async () => {
    const filesToSync = deviceFiles.filter(f => f.selected);
    if (filesToSync.length === 0) return;

    const isBatch = filesToSync.length > 1;
    startTimer();

    for (const fileData of filesToSync) {
      setTransferProgress(0);
      try {
        await new Promise<void>((resolve, reject) => {
            bluetoothService.downloadFile(
                fileData.name,
                fileData.rawName,
                fileData.rawSize,
                (pct) => setTransferProgress(pct),
                (file) => {
                    onCreateMeeting(file, { isBatch });
                    resolve();
                },
                (errStr) => {
                    // Log error but continue flow
                    error(`同步文件 ${fileData.name} 失败: ${errStr}`);
                    resolve(); 
                }
            );
        });
      } catch (e) {
        console.error("Sync loop error", e);
      }
    }

    stopTimer();
    setTransferProgress(100);
    setTimeout(() => {
      onSyncComplete();
      closeSyncModal();
      success(`成功同步 ${filesToSync.length} 个文件`);
    }, 500);
  }, [deviceFiles, onCreateMeeting, onSyncComplete, closeSyncModal, error, success]);

  return {
    isModalOpen,
    connectionState,
    deviceFiles,
    deviceStatus,
    transferProgress,
    transferTime,
    openSyncModal,
    closeSyncModal,
    toggleFileSelection,
    handleSync
  };
};
