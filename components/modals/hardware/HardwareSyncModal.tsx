
import React from 'react';
import { Cpu, RefreshCw, CheckCircle2, Circle, Wifi, Battery, HardDrive, Download } from 'lucide-react';
import { BaseModal } from '../../modals/BaseModal';
import { Button } from '../../common/Button';
import { HardwareFile } from '../../../hooks/useHardwareSync';

interface HardwareSyncModalProps {
  connectionState: 'idle' | 'searching' | 'connected' | 'syncing';
  files: HardwareFile[];
  onToggleFile: (id: string) => void;
  onSync: () => void;
  onClose: () => void;
}

export const HardwareSyncModal: React.FC<HardwareSyncModalProps> = ({
  connectionState,
  files,
  onToggleFile,
  onSync,
  onClose
}) => {
  const selectedCount = files.filter(f => f.selected).length;

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
        
        {/* State: Searching / Syncing */}
        {(connectionState === 'searching' || connectionState === 'syncing') && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-10">
             <div className="relative">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
                   <RefreshCw size={32} className="animate-spin" />
                </div>
                {connectionState === 'searching' && (
                  <div className="absolute top-0 right-0 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                )}
             </div>
             <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {connectionState === 'searching' ? '正在搜索设备...' : '正在同步文件...'}
                </h3>
                <p className="text-sm text-slate-500">
                  {connectionState === 'searching' ? '请确保 MeetingMic Pro 已开启蓝牙或通过 USB 连接' : '请勿断开设备连接'}
                </p>
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
                         <div className="text-xs text-slate-400 font-mono">ID: MM-2023-X9</div>
                      </div>
                   </div>
                   <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded flex items-center gap-1">
                      <Wifi size={12} /> 已连接
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                   <div className="flex items-center gap-2">
                      <Battery size={16} className="text-slate-400" />
                      <div className="text-xs">
                         <div className="text-slate-400">电量</div>
                         <div className="font-bold">82%</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <HardDrive size={16} className="text-slate-400" />
                      <div className="text-xs">
                         <div className="text-slate-400">存储空间</div>
                         <div className="font-bold">14.2 GB 可用</div>
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
                                  <span>{file.size}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {file.duration}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

      </div>
    </BaseModal>
  );
};
