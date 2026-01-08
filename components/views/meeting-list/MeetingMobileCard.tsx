
import React from 'react';
import { Cpu, Calendar, Clock, MoreVertical, Users, User, Star, Inbox, Folder, RotateCcw } from 'lucide-react';
import { MeetingFile, Folder as FolderType } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';
import { MeetingActionMenu } from '../../common/MeetingActionMenu';
import { formatTime } from '../../../utils/formatUtils';
import { MeetingIcon } from '../../common/MeetingIcon';

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

  const getFolderInfo = (folderId?: string) => {
    const folder = folders.find(f => f.id === folderId);
    return {
      name: folder ? folder.name : '未分类',
      icon: folder ? <Folder size={10} /> : <Inbox size={10} />,
      isUncategorized: !folder
    };
  };

  const isProcessing = meeting.status === 'processing';
  const isError = meeting.status === 'error';
  const isHardware = meeting.name.toLowerCase().startsWith('hardware');
  const isActive = activeMenuId === meeting.id;
  const ownerName = getOwnerName(meeting);
  const folderInfo = getFolderInfo(meeting.folderId);

  return (
    <div 
      className={`bg-white p-4 rounded-xl border shadow-sm relative ${isProcessing ? 'border-slate-100 opacity-80' : 'border-slate-200'}`}
      onClick={() => { if (!isProcessing) onSelectMeeting(meeting.id); }}
    >
       {/* Header: Icon, Name, Menu */}
       <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
             <MeetingIcon format={meeting.format} status={meeting.status} size={20} />
             <div className="min-w-0">
                <div className="flex items-center gap-2">
                   <h4 className="font-bold text-sm text-slate-900 truncate">{meeting.name}</h4>
                   {isHardware && <Cpu size={12} className="text-amber-500 flex-shrink-0"/>}
                   {meeting.isReadOnly && <Users size={12} className="text-purple-500 flex-shrink-0"/>}
                   {meeting.isStarred && <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                  <span className="uppercase font-mono">{meeting.format}</span>
                  <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                  <div className={`flex items-center gap-1 ${folderInfo.isUncategorized ? 'text-slate-300' : 'text-slate-400'}`}>
                       {folderInfo.icon}
                       <span className="truncate max-w-[80px]">{folderInfo.name}</span>
                  </div>
                </div>
             </div>
          </div>
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

       {/* Status & Retry */}
       <div className="flex items-center justify-between">
          <StatusBadge status={meeting.status} />
          {isError && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAction(meeting, 'retry');
              }}
              className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <RotateCcw size={12} /> 重试
            </button>
          )}
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
