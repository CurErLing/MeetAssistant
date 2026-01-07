
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { MeetingFile } from '../../types';
import { MeetingActionMenu } from './MeetingActionMenu';
import { Dropdown } from './Dropdown';

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

  return (
    <Dropdown
      isOpen={isActive}
      onToggle={(nextState) => onToggle(nextState ? meeting.id : null)}
      trigger={(isOpen) => (
        <button 
          className={`p-2 rounded-full transition-all ${
            isOpen 
              ? 'text-slate-900 bg-slate-100' 
              : 'text-slate-300 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
           <MoreHorizontal size={20} />
        </button>
      )}
      content={(close) => (
         <MeetingActionMenu 
           status={meeting.status}
           isStarred={meeting.isStarred}
           layout="desktop"
           onAction={(action) => {
             onAction(meeting, action);
             close();
           }} 
         />
      )}
    />
  );
};
