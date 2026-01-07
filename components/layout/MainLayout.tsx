
import React from 'react';
import { Sidebar } from '../sidebar';
import { ViewState, Folder } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
  // Sidebar Props
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isHardwareConnecting: boolean;
  onConnectHardware: () => void;
  meetingsCount: number;
  deletedCount: number;
  folders: Folder[];
  onAddFolder: (name: string) => void;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onShareFolder: (id: string) => void;
  userEmail?: string;
  userId?: string;
  onLogout?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentView,
  onChangeView,
  isHardwareConnecting,
  onConnectHardware,
  meetingsCount,
  deletedCount,
  folders,
  onAddFolder,
  selectedFolderId,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
  onShareFolder,
  userEmail,
  userId,
  onLogout
}) => {
  // Determine if we should show scrollbar or hide overflow based on view
  const isDetailView = currentView === 'detail';

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={onChangeView}
        isHardwareConnecting={isHardwareConnecting} 
        onConnectHardware={onConnectHardware}
        meetingsCount={meetingsCount}
        deletedCount={deletedCount}
        folders={folders}
        onAddFolder={onAddFolder}
        selectedFolderId={selectedFolderId}
        onSelectFolder={onSelectFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
        onShareFolder={onShareFolder}
        userEmail={userEmail}
        userId={userId}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full lg:h-screen overflow-hidden bg-slate-50/50 relative">
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 scroll-smooth overscroll-contain ${isDetailView ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
           <div className={`max-w-6xl mx-auto flex flex-col w-full ${isDetailView ? 'h-full' : 'min-h-full'}`}>
              {children}
           </div>
        </main>
      </div>
    </div>
  );
};
