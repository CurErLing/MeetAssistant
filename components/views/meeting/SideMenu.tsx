import React from 'react';
import { MeetingFile } from '../../../types';
import { ChevronLeft } from 'lucide-react';

interface SideMenuProps {
  meetings: MeetingFile[];
  activeMeetingId: string;
  onSelectMeeting: (id: string) => void;
  onBack: () => void;
}

interface SideMenuItemProps {
  meeting: MeetingFile;
  isActive: boolean;
  onClick: () => void;
}

// 提取单个列表项组件，避免主组件过于冗长
const SideMenuItem: React.FC<SideMenuItemProps> = ({ meeting, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-3 rounded-lg transition-all border group relative ${
      isActive 
        ? 'bg-white border-slate-200 shadow-sm z-10' 
        : 'hover:bg-slate-200/50 border-transparent opacity-80 hover:opacity-100'
    }`}
  >
      <div className={`font-bold text-sm truncate mb-1 ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>
        {meeting.name}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-mono">
          {meeting.uploadDate.toLocaleDateString()}
        </span>
        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
      </div>
  </button>
);

export const SideMenu: React.FC<SideMenuProps> = ({ 
  meetings, 
  activeMeetingId, 
  onSelectMeeting,
  onBack
}) => {
  const safeMeetings = Array.isArray(meetings) ? meetings : [];

  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 flex-shrink-0 hidden lg:flex flex-col">
       <div className="h-14 flex items-center px-4 border-b border-slate-200/60 bg-slate-50/50 flex-shrink-0">
          <button 
            onClick={onBack} 
            className="p-1.5 -ml-1.5 mr-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            title="返回列表"
          >
             <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 select-none">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">会议列表</span>
             <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded-md">{safeMeetings.length}</span>
          </div>
       </div>
       <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {safeMeetings.map(m => (
            <SideMenuItem 
              key={m.id}
              meeting={m}
              isActive={m.id === activeMeetingId}
              onClick={() => onSelectMeeting(m.id)}
            />
          ))}
          {safeMeetings.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400 mt-10">暂无其他会议</div>
          )}
       </div>
    </div>
  );
};