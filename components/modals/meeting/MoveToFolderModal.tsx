
import React from 'react';
import { FolderClosed, Inbox, Check } from 'lucide-react';
import { Button } from '../../common/Button';
import { BaseModal } from '../BaseModal';
import { MeetingFile, Folder } from '../../../types';

export const MoveToFolderModal = ({
  meeting,
  folders,
  onMove,
  onClose
}: {
  meeting: MeetingFile,
  folders: Folder[],
  onMove: (meetingId: string, folderId: string | null) => void,
  onClose: () => void
}) => {
  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-sm"
      title={
        <>
          <FolderClosed size={20} className="text-blue-600" />
          <span>移动到文件夹</span>
        </>
      }
      footer={
        <Button onClick={onClose} variant="secondary" className="w-full">取消</Button>
      }
    >
      <div className="space-y-1 overflow-y-auto max-h-[60vh]">
        <button 
          onClick={() => { onMove(meeting.id, null); onClose(); }}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${!meeting.folderId ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'hover:bg-slate-50 text-slate-600 border border-transparent'}`}
        >
          <div className="flex items-center gap-3">
             <Inbox size={18} />
             <span className="font-medium text-sm">未分类</span>
          </div>
          {!meeting.folderId && <Check size={16} />}
        </button>

        {folders.map(folder => (
          <button 
            key={folder.id}
            onClick={() => { onMove(meeting.id, folder.id); onClose(); }}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${meeting.folderId === folder.id ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'hover:bg-slate-50 text-slate-600 border border-transparent'}`}
          >
            <div className="flex items-center gap-3">
               <FolderClosed size={18} />
               <span className="font-medium text-sm truncate max-w-[180px]">{folder.name}</span>
            </div>
            {meeting.folderId === folder.id && <Check size={16} />}
          </button>
        ))}

        {folders.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-xs text-slate-400">还没有创建文件夹</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
