
import React from 'react';
import { FolderClosed } from 'lucide-react';
import { MeetingFile, Folder as FolderType } from '../../../types';
import { EmptyState } from '../../EmptyState';
import { MeetingMobileCard } from './MeetingMobileCard';

interface MobileCardListProps {
  meetings: MeetingFile[];
  folders: FolderType[];
  activeMenuId: string | null;
  onToggleMenu: (id: string | null) => void;
  onSelectMeeting: (id: string) => void;
  onAction: (meeting: MeetingFile, action: 'rename' | 'move' | 'delete' | 'toggleStar' | 'duplicate' | 'retry') => void;
}

export const MobileCardList: React.FC<MobileCardListProps> = ({
  meetings,
  folders,
  activeMenuId,
  onToggleMenu,
  onSelectMeeting,
  onAction
}) => {
  return (
    <div className="sm:hidden space-y-4">
      {meetings.length === 0 ? (
         <EmptyState 
           icon={FolderClosed}
           title="该文件夹中暂无内容"
         />
      ) : meetings.map((meeting) => (
        <MeetingMobileCard
          key={meeting.id}
          meeting={meeting}
          folders={folders}
          activeMenuId={activeMenuId}
          onToggleMenu={onToggleMenu}
          onSelectMeeting={onSelectMeeting}
          onAction={onAction}
        />
      ))}
    </div>
  );
};
