
import React, { useState, useRef } from 'react';
import { RefreshCw, Upload, Mic, Plus, ChevronDown } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface MeetingActionToolbarProps {
  onTriggerHardwareSync: () => void;
  onTriggerUpload: () => void;
  onStartRecording: () => void;
  isHardwareSyncing: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const MeetingActionToolbar: React.FC<MeetingActionToolbarProps> = ({
  onTriggerHardwareSync,
  onTriggerUpload,
  onStartRecording,
  isHardwareSyncing,
  className = "",
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  return (
    <div ref={containerRef} className={`relative z-30 ${className}`}>
       <button
         onClick={() => setIsOpen(!isOpen)}
         className={`flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 font-bold active:scale-[0.98] ${size === 'sm' ? 'px-3 py-2 text-xs' : 'px-5 py-2.5 text-sm'} w-full sm:w-auto`}
       >
          <Plus size={size === 'sm' ? 16 : 20} />
          <span>新建会议</span>
          <ChevronDown size={size === 'sm' ? 14 : 16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
       </button>

       {isOpen && (
         <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-slide-up origin-top-right overflow-hidden">
            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               选择创建方式
            </div>
            
            <button
               onClick={() => { onStartRecording(); setIsOpen(false); }}
               className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors group"
            >
               <div className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                  <Mic size={18} />
               </div>
               <div>
                  <div className="font-bold text-slate-900 group-hover:text-blue-600">开始录音</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">使用麦克风直接录制</div>
               </div>
            </button>

            <button
               onClick={() => { onTriggerUpload(); setIsOpen(false); }}
               className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors group"
            >
               <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Upload size={18} />
               </div>
               <div>
                  <div className="font-bold text-slate-900 group-hover:text-blue-600">导入文件</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">支持 MP3, WAV, M4A</div>
               </div>
            </button>

            <div className="h-px bg-slate-50 mx-4 my-1"></div>

            <button
               onClick={() => { onTriggerHardwareSync(); setIsOpen(false); }}
               disabled={isHardwareSyncing}
               className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
               <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                  <RefreshCw size={18} className={isHardwareSyncing ? "animate-spin" : ""} />
               </div>
               <div>
                  <div className="font-bold text-slate-900 group-hover:text-blue-600">{isHardwareSyncing ? '同步中...' : '同步设备'}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">连接 MeetingMic Pro</div>
               </div>
            </button>
         </div>
       )}
    </div>
  );
}
