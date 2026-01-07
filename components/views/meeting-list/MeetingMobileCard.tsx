
import React from 'react';
import { Calendar, Clock, MoreVertical, User } from 'lucide-react';
import { MeetingFile, Folder as FolderType } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';
import { MeetingActionMenu } from '../../common/MeetingActionMenu';
import { formatTime } from '../../../utils/formatUtils';
import { MeetingMeta } from '../../common/MeetingMeta';

interface MeetingMobileCardProps {
  meeting: MeetingFile;
  folders: FolderType[];
  activeMenuId: string | null;
  onToggleMenu: (id: string | null) => void;
  onSelectMeeting: (id: string) => void;
  onAction: (meeting: MeetingFile, action: 'rename' | 'move' | 'delete' | 'toggleStar' | 'duplicate' | 'retry') => void;
}

export const MeetingMobileCard: React.FC<MeetingMobileCardProps> = ({
  meeting,
  folders,
  activeMenuId,
  onToggleMenu,
  onSelectMeeting,
  onAction
}) => {
  const getOwnerName = (meeting: MeetingFile) => {
    if (!meeting.isReadOnly) return '我';
    const hash = meeting.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const owners = ['雷军', '张小龙', 'Tim Cook', '产品总监', 'CTO', '王兴'];
    return owners[hash % owners.length];
  };

  const isProcessing = meeting.status === 'processing';
  const isActive = activeMenuId === meeting.id;
  const ownerName = getOwnerName(meeting);
  const currentFolder = folders.find(f => f.id === meeting.folderId);

  return (
    <div 
      className={`bg-white p-4 rounded-xl border shadow-sm relative ${isProcessing ? 'border-slate-100 opacity-80' : 'border-slate-200'}`}
      onClick={() => { if (!isProcessing) onSelectMeeting(meeting.id); }}
    >
       {/* Header: Icon, Name, Meta */}
       <div className="flex items-start justify-between mb-3">
          <MeetingMeta 
            meeting={meeting} 
            folder={currentFolder} 
            isProcessing={isProcessing} 
            className="flex-1"
          />
          <button 
            className="p-2 -mr-2 -mt-2 text-slate-400 active:bg-slate-50 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu(isActive ? null : meeting.id);
            }}
          >
            <MoreVertical size={20} />
          </button>
       </div>

       {/* Meta Info */}
       <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 border-t border-slate-50 pt-3">
          <div className="flex items-center gap-1.5">
             <User size={12} />
             <span>{ownerName}</span>
          </div>
          <div className="flex items-center gap-1.5">
             <Calendar size={12} />
             <span>{meeting.uploadDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
             <Clock size={12} />
             <span className="font-mono">
                {meeting.duration > 0 ? formatTime(meeting.duration) : '--:--'}
             </span>
          </div>
       </div>

       {/* Status */}
       <div>
          <StatusBadge status={meeting.status} />
       </div>

       {/* Mobile Action Menu (Overlay) */}
       {isActive && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); onToggleMenu(null); }}></div>
            <div className="absolute right-4 top-10 z-20">
               <MeetingActionMenu 
                 status={meeting.status}
                 isStarred={meeting.isStarred}
                 layout="mobile"
                 onAction={(action) => {
                   onAction(meeting, action);
                   onToggleMenu(null);
                 }} 
               />
            </div>
          </>
       )}
    </div>
  );
};
