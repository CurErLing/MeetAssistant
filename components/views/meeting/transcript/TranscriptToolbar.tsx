
import React from 'react';
import { Users, History } from 'lucide-react';

interface TranscriptToolbarProps {
  uploadDate: Date;
  onManageSpeakers: () => void;
}

export const TranscriptToolbar: React.FC<TranscriptToolbarProps> = ({
  uploadDate,
  onManageSpeakers
}) => {
  return (
    <div className="flex items-center justify-between px-4 sm:px-8 py-3 bg-white border-b border-slate-50/50 flex-shrink-0">
      <button 
        onClick={onManageSpeakers} 
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-100 transition-all"
      >
        <Users size={12} /> 管理发言人
      </button>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
        <History size={14} /> <span className="hidden sm:inline">转写完成于</span> {uploadDate.toLocaleTimeString()}
      </div>
    </div>
  );
};
