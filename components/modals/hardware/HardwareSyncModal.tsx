
import React from 'react';
import { Cpu, Bluetooth, Download } from 'lucide-react';
import { BaseModal } from '../../modals/BaseModal';
import { Button } from '../../common/Button';
import { HardwareFile } from '../../../hooks/useHardwareSync';
import { DeviceStatusCard } from './DeviceStatusCard';
import { DeviceFileList } from './DeviceFileList';
import { formatTime } from '../../../utils/formatUtils';

interface HardwareSyncModalProps {
  connectionState: 'idle' | 'searching' | 'connected' | 'syncing' | 'disconnected';
  files: HardwareFile[];
  deviceStatus?: { battery: number; version: string; capacity?: { used: number; total: number } | null };
  transferProgress?: number;
  transferTime?: number;
  onToggleFile: (id: string) => void;
  onSync: () => void;
  onClose: () => void;
}

export const HardwareSyncModal: React.FC<HardwareSyncModalProps> = ({
  connectionState,
  files,
  deviceStatus = { battery: 0, version: '', capacity: null },
  transferProgress = 0,
  transferTime = 0,
  onToggleFile,
  onSync,
  onClose
}) => {
  const selectedCount = files.filter(f => f.selected).length;
  
  // Progress Circle Config
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (transferProgress / 100) * circumference;

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={
        <>
          <Cpu size={20} className="text-blue-600" />
          <span>硬件设备同步</span>
        </>
      }
      footer={
        connectionState === 'connected' ? (
          <>
             <Button variant="secondary" onClick={onClose} className="flex-1">取消</Button>
             <Button onClick={onSync} className="flex-1" disabled={selectedCount === 0} icon={<Download size={16}/>}>
               同步选中文件 ({selectedCount})
             </Button>
          </>
        ) : null
      }
    >
      <div className="min-h-[300px] flex flex-col">
        
        {/* State: Searching */}
        {connectionState === 'searching' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-10">
             <div className="relative">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
                   <Bluetooth size={32} className="animate-pulse" />
                </div>
                <div className="absolute top-0 right-0 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
             </div>
             <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 mb-2">正在搜索设备...</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  请确保录音笔已开机，并且蓝牙已开启。在浏览器弹出的窗口中选择您的设备。
                </p>
             </div>
          </div>
        )}

        {/* State: Syncing */}
        {connectionState === 'syncing' && (
           <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-10 animate-fade-in">
              <div className="relative w-32 h-32 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r={radius} stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="64" cy="64" r={radius} 
                      stroke="#3b82f6" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={circumference} 
                      strokeDashoffset={strokeDashoffset} 
                      strokeLinecap="round"
                      className="transition-all duration-300 ease-linear" 
                    />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                    <span className="font-bold text-2xl text-blue-600">{Math.round(transferProgress)}%</span>
                 </div>
              </div>
              <div className="text-center">
                 <h3 className="text-xl font-bold text-slate-900 mb-2">正在传输录音...</h3>
                 <p className="text-sm text-slate-500 mb-1">请保持设备连接，不要关闭窗口</p>
                 <p className="text-xs text-slate-400 font-mono">已耗时: {formatTime(transferTime)}</p>
              </div>
           </div>
        )}

        {/* State: Connected */}
        {connectionState === 'connected' && (
          <div className="animate-fade-in space-y-6">
             <DeviceStatusCard 
               battery={deviceStatus.battery} 
               version={deviceStatus.version} 
               capacity={deviceStatus.capacity} 
             />
             <DeviceFileList 
               files={files} 
               onToggleFile={onToggleFile} 
             />
          </div>
        )}

      </div>
    </BaseModal>
  );
};
