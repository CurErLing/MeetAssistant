
import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { HardwareFile } from '../../../hooks/useHardwareSync';

interface DeviceFileListProps {
  files: HardwareFile[];
  onToggleFile: (id: string) => void;
}

export const DeviceFileList: React.FC<DeviceFileListProps> = ({ files, onToggleFile }) => {
  return (
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
  );
};
