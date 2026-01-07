
import React, { useState } from 'react';
import { useAppStore } from './hooks/useAppStore';
import { useGlobalState } from './hooks/useGlobalState';
import { GlobalModals } from './components/GlobalModals';
import { MainLayout } from './components/layout/MainLayout';
import { AppViews } from './components/AppViews';
import { ViewState } from './types';
import { AlertTriangle } from 'lucide-react';

interface AuthenticatedAppProps {
  user: any; // Supabase User object
  onLogout: () => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ user, onLogout }) => {
  const store = useAppStore(user);
  const [navSource, setNavSource] = useState<'home' | 'sidebar'>('sidebar');
  const [returnView, setReturnView] = useState<ViewState>('list');

  // New Hook: Manage global actions (upload, recorder, hardware)
  const globalActions = useGlobalState(
    (file, trimStart, trimEnd) => {
      store.createMeeting(file, trimStart, trimEnd);
      store.setSelectedFolderId(null);
      store.setView('list');
    },
    () => { /* sync complete callback if needed */ }
  );

  const handleShareFolder = (folderId: string) => {
    const folder = store.folders.find(f => f.id === folderId);
    if (folder) {
        const shareLink = `https://jimumeeting.ai/share/folder/${folderId}`;
        navigator.clipboard.writeText(shareLink);
        alert(`“${folder.name}”的分享链接已生成并复制到剪贴板！\n链接: ${shareLink}`);
    }
  };

  const TEMPLATE_CATEGORIES = ['通用', '会议', '演讲', '面试'];

  return (
    <>
      <input 
        type="file" 
        ref={globalActions.fileInputRef} 
        className="hidden" 
        accept=".wav,.mp3" 
        onChange={globalActions.handleFileInputChange} 
      />
      
      <GlobalModals 
        pendingFile={globalActions.pendingFile}
        onConfirmUpload={globalActions.handleConfirmUpload}
        onCancelUpload={globalActions.handleCancelUpload}
        
        isWebRecorderOpen={globalActions.isWebRecorderOpen}
        onSaveRecording={globalActions.handleSaveRecording}
        onCloseWebRecorder={() => globalActions.setIsWebRecorderOpen(false)}
        
        isHardwareModalOpen={globalActions.hardware.isModalOpen}
        hardwareConnectionState={globalActions.hardware.connectionState}
        deviceFiles={globalActions.hardware.deviceFiles}
        onToggleHardwareFile={globalActions.hardware.toggleFileSelection}
        onSyncHardware={globalActions.hardware.handleSync}
        onCloseHardwareModal={globalActions.hardware.closeSyncModal}
        
        activeHomeTemplate={null} // Simplified, template logic can be managed in views if needed
        templateCategories={TEMPLATE_CATEGORIES}
        onSaveTemplate={store.updateTemplate}
        onDeleteTemplate={store.deleteTemplate}
        onCloseTemplateModal={() => {}} 
      />

      {store.error && (
        <div className="bg-red-50 border-b border-red-200 p-3 text-red-700 text-sm flex items-center justify-center gap-2 animate-fade-in relative z-[60]">
           <AlertTriangle size={16} />
           <span className="font-bold">无法连接服务器:</span> {store.error}
        </div>
      )}

      {/* External Share View handled in AppViews */}
      {store.view === 'external-share' ? (
         <AppViews 
            store={store}
            globalActions={globalActions}
            setReturnView={setReturnView}
            returnView={returnView}
            setNavSource={setNavSource}
            navSource={navSource}
         />
      ) : (
        <MainLayout
          currentView={store.view} 
          onChangeView={(view) => store.setView(view)}
          isHardwareConnecting={globalActions.hardware.connectionState === 'searching' || globalActions.hardware.connectionState === 'syncing'} 
          onConnectHardware={globalActions.hardware.openSyncModal}
          meetingsCount={store.meetings.length}
          deletedCount={store.deletedMeetings.length}
          folders={store.folders}
          onAddFolder={store.addFolder}
          selectedFolderId={store.selectedFolderId}
          onSelectFolder={(id) => {
            store.setSelectedFolderId(id);
            setNavSource('sidebar');
          }}
          onRenameFolder={store.updateFolder}
          onDeleteFolder={store.deleteFolder}
          onShareFolder={handleShareFolder}
          userEmail={user?.email || user?.phone}
          userId={user?.id}
          onLogout={onLogout}
        >
            <AppViews 
              store={store}
              globalActions={globalActions}
              setReturnView={setReturnView}
              returnView={returnView}
              setNavSource={setNavSource}
              navSource={navSource}
            />
        </MainLayout>
      )}
    </>
  );
};

export default AuthenticatedApp;
