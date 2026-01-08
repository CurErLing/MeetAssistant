
import React, { useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { MeetingFile } from '../../types';
import { MeetingActionMenu } from './MeetingActionMenu';
import { useClickOutside } from '../../hooks/useClickOutside';

interface MeetingActionDropdownProps {
  meeting: MeetingFile;
  activeMenuId: string | null;
  onToggle: (id: string | null) => void;
  onAction: (meeting: MeetingFile, action: 'rename' | 'move' | 'delete' | 'toggleStar' | 'duplicate' | 'retry') => void;
}

export const MeetingActionDropdown: React.FC<MeetingActionDropdownProps> = ({
  meeting,
  activeMenuId,
  onToggle,
  onAction
}) => {
  const isActive = activeMenuId === meeting.id;
  const containerRef = useRef<HTMLDivElement>(null);

  // 封装点击外部关闭逻辑：当菜单打开时，点击组件外部会自动关闭
  useClickOutside(containerRef, () => {
    if (isActive) onToggle(null);
  }, isActive);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button 
        className={`p-2 rounded-full transition-all ${
          isActive 
            ? 'text-slate-900 bg-slate-100' 
            : 'text-slate-300 hover:text-slate-900 hover:bg-slate-100'
        }`}
        onClick={(e) => {
           e.stopPropagation();
           onToggle(isActive ? null : meeting.id);
        }}
      >
         <MoreHorizontal size={20} />
      </button>

      {isActive && (
        <div className="absolute right-0 top-full mt-1 z-50">
           <MeetingActionMenu 
             status={meeting.status}
             isStarred={meeting.isStarred}
             layout="desktop"
             onAction={(action) => {
               onAction(meeting, action);
               onToggle(null); // 执行操作后自动关闭菜单
             }} 
           />
        </div>
      )}
    </div>
  );
};
