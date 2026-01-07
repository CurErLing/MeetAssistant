
import React from 'react';
import { FolderClosed } from 'lucide-react';
import { MeetingFile, Folder as FolderType } from '../../../types';
import { EmptyState } from '../../EmptyState';
import { MeetingTableRow } from './MeetingTableRow';

interface DesktopTableProps {
  meetings: MeetingFile[];
  folders: FolderType[];
  activeMenuId: string | null;
  onToggleMenu: (id: string | null) => void;
  onSelectMeeting: (id: string) => void;
  onTriggerUpload: () => void;
  onAction: (meeting: MeetingFile, action: 'rename' | 'move' | 'delete' | 'toggleStar' | 'duplicate' | 'retry') => void;
}

export const DesktopTable: React.FC<DesktopTableProps> = ({
  meetings,
  folders,
  activeMenuId,
  onToggleMenu,
  onSelectMeeting,
  onAction
}) => {
  return (
    <div className="hidden sm:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider rounded-tl-xl">会议名称</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">所有者</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">日期</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">时长</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right rounded-tr-xl">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {meetings.length === 0 ? (
             <tr>
               <td colSpan={6} className="p-0 border-none">
                  <EmptyState 
                    icon={FolderClosed}
                    title="该文件夹中暂无内容"
                    className="border-none bg-transparent py-20"
                  />
               </td>
             </tr>
          ) : meetings.map((meeting) => (
            <MeetingTableRow
              key={meeting.id}
              meeting={meeting}
              folders={folders}
              activeMenuId={activeMenuId}
              onToggleMenu={onToggleMenu}
              onSelectMeeting={onSelectMeeting}
              onAction={onAction}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
