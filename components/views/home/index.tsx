
import React from 'react';
import { MeetingFile, Template, Folder } from '../../../types';
import { HomeHeader } from './HomeHeader';
import { HomeFolderSection } from './HomeFolderSection';
import { HomeDocumentList } from './HomeDocumentList';
import { useMeetingModals } from '../../../hooks/useMeetingModals';
import { useFolderModals } from '../../../hooks/useFolderModals';

interface HomeViewProps {
  meetings: MeetingFile[];
  folders: Folder[];
  templates: Template[];
  onSelectMeeting: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onSelectTemplate: (id: string) => void;
  onViewMoreMeetings: () => void;
  onViewMoreTemplates: () => void;
  onTriggerUpload: () => void;
  onTriggerHardwareSync: () => void;
  onStartRecording: () => void;
  isHardwareSyncing: boolean;
  onAddFolder: (name: string) => void;
  onRenameFolder?: (id: string, name: string) => void;
  onDeleteFolder?: (id: string) => void;
  onShareFolder?: (id: string) => void;
  onDeleteMeeting: (id: string) => void;
  onMoveMeeting: (meetingId: string, folderId: string | null) => void;
  onRenameMeeting: (id: string, newName: string) => void;
  onToggleStar: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRetry: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  meetings,
  folders,
  templates,
  onSelectMeeting,
  onSelectFolder,
  onSelectTemplate,
  onViewMoreMeetings,
  onViewMoreTemplates,
  onTriggerUpload,
  onTriggerHardwareSync,
  onStartRecording,
  isHardwareSyncing,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onShareFolder,
  onDeleteMeeting,
  onMoveMeeting,
  onRenameMeeting,
  onToggleStar,
  onDuplicate,
  onRetry,
  searchQuery,
  onSearchChange
}) => {
  // Hooks for Modals
  const { handleMeetingAction, MeetingModals } = useMeetingModals(folders, {
    deleteMeeting: onDeleteMeeting,
    moveMeeting: onMoveMeeting,
    renameMeeting: onRenameMeeting,
    toggleStar: onToggleStar,
    duplicate: onDuplicate,
    retry: onRetry
  });

  const { openCreateDialog, openRenameDialog, openDeleteDialog, openShareDialog, FolderModals } = useFolderModals({
    addFolder: onAddFolder,
    renameFolder: onRenameFolder,
    deleteFolder: onDeleteFolder,
    shareFolder: onShareFolder
  }, folders);

  return (
    <div className="space-y-8 sm:space-y-12 animate-fade-in pb-20 sm:pb-10">
      {/* Render Modals */}
      <MeetingModals />
      <FolderModals />

      {/* 1. Header Section */}
      <HomeHeader 
        onTriggerHardwareSync={onTriggerHardwareSync}
        onTriggerUpload={onTriggerUpload}
        onStartRecording={onStartRecording}
        isHardwareSyncing={isHardwareSyncing}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      {/* 2. Folders Section */}
      <HomeFolderSection 
        folders={folders}
        onSelectFolder={onSelectFolder}
        onRequestCreate={openCreateDialog}
        onRequestRename={openRenameDialog}
        onRequestDelete={openDeleteDialog}
        onRequestShare={openShareDialog}
      />

      {/* 3. Document List Section */}
      <HomeDocumentList 
        meetings={meetings}
        folders={folders}
        onSelectMeeting={onSelectMeeting}
        onDeleteMeeting={(id) => handleMeetingAction({ id } as MeetingFile, 'delete')} // Proxy for list component
        onMoveMeeting={onMoveMeeting} 
        onRenameMeeting={onRenameMeeting}
        onToggleStar={onToggleStar}
        onDuplicate={onDuplicate}
        onRetry={onRetry}
      />
    </div>
  );
};
