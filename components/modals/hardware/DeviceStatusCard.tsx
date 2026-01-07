
import React from 'react';
import { Cpu, Bluetooth, Battery, HardDrive } from 'lucide-react';

interface DeviceStatusCardProps {
  battery: number;
  version: string;
  capacity?: { used: number; total: number } | null;
}

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({ battery, version, capacity }) => {
  const formatCapacity = (bytes: number) => {
    if (!bytes && bytes !== 0) return '--';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${Math.round(mb)} MB`;
  };

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-lg">
      <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Cpu size={20} className="text-blue-300" />
            </div>
            <div>
                <div className="font-bold text-lg">MeetingMic Pro</div>
                <div className="text-xs text-slate-400 font-mono">FW: {version || 'v1.0.0'}</div>
            </div>
          </div>
          <div className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded flex items-center gap-1">
            <Bluetooth size={12} /> 蓝牙已连接
          </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <Battery size={16} className={battery < 20 ? 'text-red-400' : 'text-slate-400'} />
            <div className="text-xs">
                <div className="text-slate-400">电量</div>
                <div className="font-bold">{battery}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-slate-400" />
            <div className="text-xs">
                <div className="text-slate-400">存储</div>
                <div className="font-bold">
                  {capacity 
                    ? `${formatCapacity(capacity.used)} / ${formatCapacity(capacity.total)}` 
                    : '-- / --'}
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};
