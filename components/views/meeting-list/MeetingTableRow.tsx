
import React from 'react';
import { Calendar, Clock, RotateCcw } from 'lucide-react';
import { MeetingFile, Folder as FolderType } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';
import { MeetingActionDropdown } from '../../common/MeetingActionDropdown';
import { formatTime } from '../../../utils/formatUtils';
import { MeetingMeta } from '../../common/MeetingMeta';
import { getOwnerName } from '../../../utils/meetingUtils';

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
  const isProcessing = meeting.status === 'processing';
  const isError = meeting.status === 'error';
  
  const ownerName = getOwnerName(meeting);
  const folder = folders.find(f => f.id === meeting.folderId);

  return (
    <tr 
      className={`transition-colors group ${isProcessing ? 'cursor-not-allowed opacity-70 bg-slate-50/30' : 'hover:bg-slate-50 cursor-pointer'}`}
      onClick={() => !isProcessing && onSelectMeeting(meeting.id)}
    >
      <td className="px-6 py-4">
        <MeetingMeta 
          meeting={meeting} 
          folder={folder} 
          isProcessing={isProcessing} 
        />
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
        <div className="flex items-center gap-2">
          <StatusBadge status={meeting.status} />
          {isError && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAction(meeting, 'retry');
              }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-1 text-[10px] font-bold"
              title="重试转写"
            >
              <RotateCcw size={12} />
              重试
            </button>
          )}
        </div>
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
