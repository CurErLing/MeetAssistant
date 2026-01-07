
import React from 'react';
import { LayoutTemplate, Sparkles, Users, MessagesSquare, MessageCircleQuestion } from 'lucide-react';

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: '全部', icon: <LayoutTemplate size={16} /> },
    { id: 'general', label: '通用', icon: <Sparkles size={16} /> },
    { id: 'meeting', label: '会议', icon: <Users size={16} /> },
    { id: 'speech', label: '演讲', icon: <MessagesSquare size={16} /> },
    { id: 'interview', label: '面试', icon: <MessageCircleQuestion size={16} /> },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-2 mb-6 shadow-sm sticky top-16 z-20">
       <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                (activeFilter === f.label || (activeFilter === '全部' && f.id === 'all'))
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
       </div>
    </div>
  );
};
