
import React, { useState } from 'react';
import { MeetingFile, Folder } from '../../../types';
import { useMeetingModals } from '../../../hooks/useMeetingModals';
import { useFolderModals } from '../../../hooks/useFolderModals';

// Sub-components
import { EmptyStateView } from './EmptyStateView';
import { MeetingListHeader } from './MeetingListHeader';
import { DesktopTable } from './DesktopTable';
import { MobileCardList } from './MobileCardList';

interface MeetingListViewProps {
  meetings: MeetingFile[];
  folders?: Folder[];
  currentFolderName: string | null;
  onTriggerUpload: () => void;
  onTriggerHardwareSync: () => void;
  onStartRecording: () => void;
  isHardwareSyncing: boolean;
  onSelectMeeting: (id: string) => void;
  onDeleteMeeting: (id: string) => void;
  onMoveMeeting: (meetingId: string, folderId: string | null) => void;
  onRenameMeeting: (id: string, newName: string) => void;
  onClearFolder: () => void;
  onBack: () => void;
  showBackButton?: boolean;
  selectedFolderId?: string | null;
  onRenameFolder?: (id: string, name: string) => void;
  onDeleteFolder?: (id: string) => void;
  onShareFolder?: (id: string) => void;
  onToggleStar: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRetry: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const MeetingListView: React.FC<MeetingListViewProps> = ({ 
  meetings, 
  folders = [],
  currentFolderName,
  onTriggerUpload, 
  onTriggerHardwareSync,
  onStartRecording,
  isHardwareSyncing,
  onSelectMeeting,
  onDeleteMeeting,
  onMoveMeeting,
  onRenameMeeting,
  onClearFolder,
  onBack,
  showBackButton = false,
  selectedFolderId,
  onRenameFolder,
  onDeleteFolder,
  onShareFolder,
  onToggleStar,
  onDuplicate,
  onRetry,
  searchQuery,
  onSearchChange
}) => {
  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Hook for Meeting Modals
  const { handleMeetingAction, MeetingModals } = useMeetingModals(folders, {
    deleteMeeting: onDeleteMeeting,
    moveMeeting: onMoveMeeting,
    renameMeeting: onRenameMeeting,
    toggleStar: onToggleStar,
    duplicate: onDuplicate,
    retry: onRetry
  });

  // Hook for Folder Modals
  const { openRenameDialog, openDeleteDialog, openShareDialog, FolderModals } = useFolderModals({
    addFolder: () => {}, // MeetingListView generally doesn't add folders
    renameFolder: onRenameFolder,
    deleteFolder: onDeleteFolder,
    shareFolder: onShareFolder
  }, folders);

  // Only show empty state if truly empty (no search query) AND no folder is selected (or folder is empty)
  // If there is a search query, an empty list means "no results found", not "empty state".
  const isSearchActive = !!searchQuery;
  const showEmptyState = meetings.length === 0 && !currentFolderName && !isSearchActive;

  if (showEmptyState) {
    return (
      <EmptyStateView 
        onTriggerUpload={onTriggerUpload}
        onTriggerHardwareSync={onTriggerHardwareSync}
        onStartRecording={onStartRecording}
        isHardwareSyncing={isHardwareSyncing}
      />
    );
  }

  // Find current folder object if needed
  const currentFolder = selectedFolderId ? folders.find(f => f.id === selectedFolderId) : null;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* --- Render Modals --- */}
      <MeetingModals />
      <FolderModals />

      {/* --- Header --- */}
      <MeetingListHeader 
        currentFolderName={currentFolderName}
        meetingsCount={meetings.length}
        onClearFolder={onClearFolder}
        onBack={onBack}
        onTriggerUpload={onTriggerUpload}
        onTriggerHardwareSync={onTriggerHardwareSync}
        onStartRecording={onStartRecording}
        isHardwareSyncing={isHardwareSyncing}
        showBackButton={showBackButton}
        onRenameFolder={currentFolder ? () => openRenameDialog(currentFolder) : undefined}
        onDeleteFolder={selectedFolderId ? () => openDeleteDialog(selectedFolderId) : undefined}
        onShareFolder={selectedFolderId ? () => openShareDialog(selectedFolderId) : undefined}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      {/* --- Desktop View (Table) --- */}
      <DesktopTable 
        meetings={meetings}
        folders={folders}
        activeMenuId={activeMenuId}
        onToggleMenu={setActiveMenuId}
        onSelectMeeting={onSelectMeeting}
        onTriggerUpload={onTriggerUpload}
        onAction={handleMeetingAction}
      />

      {/* --- Mobile View (Cards) --- */}
      <MobileCardList 
        meetings={meetings}
        folders={folders}
        activeMenuId={activeMenuId}
        onToggleMenu={setActiveMenuId}
        onSelectMeeting={onSelectMeeting}
        onAction={handleMeetingAction}
      />
    </div>
  );
};
