
import React from 'react';
import { MeetingFile } from '../../../types';
import { ChevronLeft } from 'lucide-react';

interface SideMenuProps {
  meetings: MeetingFile[];
  activeMeetingId: string;
  onSelectMeeting: (id: string) => void;
  onBack: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ 
  meetings, 
  activeMeetingId, 
  onSelectMeeting,
  onBack
}) => {
  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 flex-shrink-0 hidden lg:flex flex-col">
       <div className="h-14 flex items-center px-4 border-b border-slate-200/60 bg-slate-50/50">
          <button 
            onClick={onBack} 
            className="p-1.5 -ml-1.5 mr-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            title="返回列表"
          >
             <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 select-none">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">会议列表</span>
             <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded-md">{meetings ? meetings.length : 0}</span>
          </div>
       </div>
       <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {meetings && meetings.map(m => {
            const isActive = m.id === activeMeetingId;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMeeting(m.id)}
                className={`w-full text-left p-3 rounded-lg transition-all border group relative ${
                  isActive 
                    ? 'bg-white border-slate-200 shadow-sm z-10' 
                    : 'hover:bg-slate-200/50 border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                 <div className={`font-bold text-sm truncate mb-1 ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>
                   {m.name}
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.uploadDate.toLocaleDateString()}
                    </span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                 </div>
              </button>
            );
          })}
       </div>
    </div>
  );
};
