
import React, { useState } from 'react';
import { Type } from 'lucide-react';
import { MeetingFile, Folder } from '../types';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { InputModal } from '../components/modals/InputModal';
import { MoveToFolderModal } from '../components/modals/meeting/MoveToFolderModal';

interface MeetingActions {
  deleteMeeting: (id: string) => void;
  moveMeeting: (id: string, folderId: string | null) => void;
  renameMeeting: (id: string, name: string) => void;
  toggleStar: (id: string) => void;
  duplicate: (id: string) => void;
  retry?: (id: string) => void;
}

export const useMeetingModals = (
  folders: Folder[],
  actions: MeetingActions
) => {
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [meetingToMove, setMeetingToMove] = useState<MeetingFile | null>(null);
  const [meetingToRename, setMeetingToRename] = useState<MeetingFile | null>(null);

  const handleMeetingAction = (meeting: MeetingFile, action: 'rename' | 'move' | 'delete' | 'toggleStar' | 'duplicate' | 'retry') => {
    // 只读文件检查 (除了 toggleStar, duplicate)
    if ((action === 'rename' || action === 'delete' || action === 'move' || action === 'retry') && meeting.isReadOnly) {
      alert("只读文件无法执行此操作");
      return;
    }

    switch (action) {
      case 'rename': setMeetingToRename(meeting); break;
      case 'move': setMeetingToMove(meeting); break;
      case 'delete': setMeetingToDelete(meeting.id); break;
      case 'toggleStar': actions.toggleStar(meeting.id); break;
      case 'duplicate': actions.duplicate(meeting.id); break;
      case 'retry': if (actions.retry) actions.retry(meeting.id); break;
    }
  };

  const MeetingModals = () => (
    <>
      <ConfirmModal 
        isOpen={!!meetingToDelete}
        onClose={() => setMeetingToDelete(null)}
        onConfirm={() => {
          if (meetingToDelete) {
            actions.deleteMeeting(meetingToDelete);
            setMeetingToDelete(null);
          }
        }}
        title="确认删除"
        description="您确定要将此会议记录移至回收站吗？"
        confirmText="删除"
        variant="danger"
      />

      {meetingToMove && (
        <MoveToFolderModal 
          meeting={meetingToMove}
          folders={folders}
          onMove={actions.moveMeeting}
          onClose={() => setMeetingToMove(null)}
        />
      )}

      {meetingToRename && (
        <InputModal 
          isOpen={true}
          onClose={() => setMeetingToRename(null)}
          title={
            <>
              <Type size={20} className="text-blue-600" />
              <span>重命名会议</span>
            </>
          }
          label="会议名称"
          initialValue={meetingToRename.name}
          onConfirm={(newName) => actions.renameMeeting(meetingToRename.id, newName)}
        />
      )}
    </>
  );

  return {
    handleMeetingAction,
    MeetingModals
  };
};
