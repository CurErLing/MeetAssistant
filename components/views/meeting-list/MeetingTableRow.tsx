
import React from 'react';
import { Cpu, Calendar, Clock, Users, Star, Inbox, Folder } from 'lucide-react';
import { MeetingFile, Folder as FolderType } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';
import { MeetingActionDropdown } from '../../common/MeetingActionDropdown';
import { formatTime } from '../../../utils/formatUtils';
import { MeetingIcon } from '../../common/MeetingIcon';

interface MeetingTableRowProps {
  meeting: MeetingFile;
  folders: FolderType[];
  activeMenuId: string | null;
  onToggleMenu: (id: string | null) => void;
  onSelectMeeting: (id: string) => void;
  onAction: (meeting: MeetingFile, action: 'rename' | 'move' | 'delete' | 'toggleStar' | 'duplicate' | 'retry') => void;
}

export const MeetingTableRow: React.FC<MeetingTableRowProps> = ({
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
  const isHardware = meeting.name.toLowerCase().startsWith('hardware') || meeting.id.includes('hardware');
  const ownerName = getOwnerName(meeting);
  const folderInfo = getFolderInfo(meeting.folderId);

  return (
    <tr 
      className={`transition-colors group ${isProcessing ? 'cursor-not-allowed opacity-70 bg-slate-50/30' : 'hover:bg-slate-50 cursor-pointer'}`}
      onClick={() => !isProcessing && onSelectMeeting(meeting.id)}
    >
      <td className="px-6 py-4">
        <div className="flex items-center space-x-4">
          <MeetingIcon format={meeting.format} status={meeting.status} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className={`font-medium text-sm transition-colors truncate max-w-[200px] ${isProcessing ? 'text-slate-400' : 'text-slate-900 group-hover:text-blue-600'}`}>
                {meeting.name}
              </div>
              {isHardware && (
                <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                  <Cpu size={10} /> 硬件同步
                </span>
              )}
              {meeting.isReadOnly && (
                <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-100">
                    <Users size={10} />
                </span>
              )}
              {meeting.isStarred && (
                <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="uppercase font-mono">{meeting.format}</span>
              <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
              <div className={`flex items-center gap-1 ${folderInfo.isUncategorized ? 'text-slate-300' : 'text-slate-500'}`} title={folderInfo.name}>
                    {folderInfo.icon}
                    <span className="truncate max-w-[80px]">{folderInfo.name}</span>
              </div>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-slate-600">{ownerName}</span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        <div className="flex items-center space-x-2">
            <Calendar size={14} className="text-slate-400" />
            <span>{meeting.uploadDate.toLocaleDateString()}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        <div className="flex items-center space-x-2">
            <Clock size={14} className="text-slate-400" />
            <span className="font-mono">
              {meeting.duration > 0 ? formatTime(meeting.duration) : '--:--'}
            </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={meeting.status} />
      </td>
      <td className="px-6 py-4 text-right relative">
        <MeetingActionDropdown 
          meeting={meeting}
          activeMenuId={activeMenuId}
          onToggle={onToggleMenu}
          onAction={onAction}
        />
      </td>
    </tr>
  );
};
