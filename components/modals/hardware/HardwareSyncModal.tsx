
import React from 'react';
import { Cpu, RefreshCw, CheckCircle2, Circle, Bluetooth, Battery, HardDrive, Download } from 'lucide-react';
import { BaseModal } from '../../modals/BaseModal';
import { Button } from '../../common/Button';
import { HardwareFile } from '../../../hooks/useHardwareSync';

interface HardwareSyncModalProps {
  connectionState: 'idle' | 'searching' | 'connected' | 'syncing' | 'disconnected';
  files: HardwareFile[];
  deviceStatus?: { battery: number; version: string; capacity?: { used: number; total: number } | null };
  transferProgress?: number;
  onToggleFile: (id: string) => void;
  onSync: () => void;
  onClose: () => void;
}

export const HardwareSyncModal: React.FC<HardwareSyncModalProps> = ({
  connectionState,
  files,
  deviceStatus = { battery: 0, version: '', capacity: null },
  transferProgress = 0,
  onToggleFile,
  onSync,
  onClose
}) => {
  const selectedCount = files.filter(f => f.selected).length;

  // Format bytes to readable string
  const formatCapacity = (bytes: number) => {
    if (!bytes && bytes !== 0) return '--';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${Math.round(mb)} MB`;
  };

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
           <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-10">
              <div className="relative w-24 h-24 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
                    <circle cx="48" cy="48" r="40" stroke="#3b82f6" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * transferProgress) / 100} className="transition-all duration-300" />
                 </svg>
                 <div className="absolute font-bold text-xl text-blue-600">{transferProgress}%</div>
              </div>
              <div className="text-center">
                 <h3 className="text-lg font-bold text-slate-900">正在传输录音...</h3>
                 <p className="text-sm text-slate-500">请保持设备连接，不要关闭窗口</p>
              </div>
           </div>
        )}

        {/* State: Connected */}
        {connectionState === 'connected' && (
          <div className="animate-fade-in space-y-6">
             {/* Device Info Card */}
             <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-lg">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                         <Cpu size={20} className="text-blue-300" />
                      </div>
                      <div>
                         <div className="font-bold text-lg">MeetingMic Pro</div>
                         <div className="text-xs text-slate-400 font-mono">FW: {deviceStatus.version || 'v1.0.0'}</div>
                      </div>
                   </div>
                   <div className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded flex items-center gap-1">
                      <Bluetooth size={12} /> 蓝牙已连接
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                   <div className="flex items-center gap-2">
                      <Battery size={16} className={deviceStatus.battery < 20 ? 'text-red-400' : 'text-slate-400'} />
                      <div className="text-xs">
                         <div className="text-slate-400">电量</div>
                         <div className="font-bold">{deviceStatus.battery}%</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <HardDrive size={16} className="text-slate-400" />
                      <div className="text-xs">
                         <div className="text-slate-400">存储</div>
                         <div className="font-bold">
                           {deviceStatus.capacity 
                             ? `${formatCapacity(deviceStatus.capacity.used)} / ${formatCapacity(deviceStatus.capacity.total)}` 
                             : '-- / --'}
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* File List */}
             <div>
                <div className="flex items-center justify-between mb-3 px-1">
                   <h4 className="text-sm font-bold text-slate-700">设备中的录音 ({files.length})</h4>
                   <span className="text-xs text-slate-400">选择要导入的文件</span>
                </div>
                {files.length === 0 ? (
                   <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                      正在读取文件列表...
                   </div>
                ) : (
                   <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar -mx-2 px-2">
                      {files.map(file => (
                         <div 
                           key={file.id}
                           onClick={() => onToggleFile(file.id)}
                           className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${file.selected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50'}`}
                         >
                            <div className="flex items-center gap-3 overflow-hidden">
                               <div className={`flex-shrink-0 ${file.selected ? 'text-blue-600' : 'text-slate-300'}`}>
                                  {file.selected ? <CheckCircle2 size={20} fill="currentColor" className="text-blue-600 bg-white rounded-full"/> : <Circle size={20} />}
                               </div>
                               <div className="min-w-0">
                                  <div className={`text-sm font-bold truncate ${file.selected ? 'text-blue-900' : 'text-slate-700'}`}>{file.name}</div>
                                  <div className="text-xs text-slate-400 flex items-center gap-2">
                                     <span>{file.date}</span>
                                     <span>•</span>
                                     <span>{(file.rawSize / 1024 / 1024).toFixed(2)} MB</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
        )}

      </div>
    </BaseModal>
  );
};
