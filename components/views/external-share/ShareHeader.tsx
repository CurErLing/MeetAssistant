
import React from 'react';
import { Mic, Calendar, Clock, LogOut } from 'lucide-react';
import { MeetingFile } from '../../../types';
import { Button } from '../../common/Button';
import { formatTime } from '../../../utils/formatUtils';

interface ShareHeaderProps {
  meeting: MeetingFile;
  onExit: () => void;
}

export const ShareHeader: React.FC<ShareHeaderProps> = ({ meeting, onExit }) => {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm z-30 flex-shrink-0">
      <div className="flex items-center gap-3 overflow-hidden">
         <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md flex-shrink-0">
            <Mic size={18} />
         </div>
         <div className="min-w-0">
            <div className="flex items-center gap-2">
               <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                 {meeting.name}
               </h1>
               <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide flex-shrink-0">
                 访客
               </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] sm:text-xs text-slate-400 mt-0.5">
               <div className="flex items-center gap-1">
                  <Calendar size={10} />
                  <span>{meeting.uploadDate.toLocaleDateString()}</span>
               </div>
               <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>{formatTime(meeting.duration)}</span>
               </div>
            </div>
         </div>
      </div>
      <Button variant="secondary" size="sm" onClick={onExit} icon={<LogOut size={14}/>} className="flex-shrink-0">
         退出
      </Button>
    </header>
  );
};
