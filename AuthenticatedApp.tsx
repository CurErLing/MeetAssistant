
import React, { useState, useRef } from 'react';
import { useAppStore } from './hooks/useAppStore';
import { useHardwareSync } from './hooks/useHardwareSync';
import { HomeView } from './components/views/home';
import { MeetingListView } from './components/views/meeting-list';
import { MeetingDetailView } from './components/views/meeting';
import { ExternalShareView } from './components/views/external-share';
import { VoiceprintManagerView } from './components/views/manager/VoiceprintManagerView';
import { HotwordManagerView } from './components/views/manager/HotwordManagerView';
import { TemplateManagerView } from './components/views/template';
import { RecycleBinView } from './components/views/recycle-bin';
import { GlobalModals } from './components/GlobalModals';
import { MainLayout } from './components/layout/MainLayout';
import { ViewState } from './types';
import { AlertTriangle } from 'lucide-react';

interface AuthenticatedAppProps {
  user: any; // Supabase User object
  onLogout: () => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ user, onLogout }) => {
  // Pass user to store to filter/bind data
  const store = useAppStore(user);
  
  // Navigation State
  const [navSource, setNavSource] = useState<'home' | 'sidebar'>('sidebar');
  const [returnView, setReturnView] = useState<ViewState>('list');

  // Hardware Sync Hook
  const {
    isModalOpen: isHardwareModalOpen,
    connectionState: hardwareConnectionState,
    deviceFiles,
    openSyncModal,
    closeSyncModal,
    toggleFileSelection,
    handleSync
  } = useHardwareSync(
    (file) => store.createMeeting(file),
    () => {
      store.setSelectedFolderId(null);
      store.setView('list');
    }
  );

  // Local UI State
  const [isWebRecorderOpen, setIsWebRecorderOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [targetTemplateId, setTargetTemplateId] = useState<string | null>(null);
  const [homeSelectedTemplateId, setHomeSelectedTemplateId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleTriggerUpload = () => fileInputRef.current?.click();
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setPendingFile(e.target.files[0]);
    e.target.value = '';
  };
  
  const handleConfirmUpload = (file: File, trimStart: number, trimEnd: number) => { 
    if (file) { 
      store.createMeeting(file, trimStart, trimEnd); 
      setPendingFile(null);
      store.setSelectedFolderId(null);
      store.setView('list'); 
    } 
  };

  const handleSaveRecording = (file: File) => {
    store.createMeeting(file);
    setIsWebRecorderOpen(false);
    store.setSelectedFolderId(null);
    store.setView('list');
  };

  const handleShareFolder = (folderId: string) => {
    const folder = store.folders.find(f => f.id === folderId);
    if (folder) {
        const shareLink = `https://jimumeeting.ai/share/folder/${folderId}`;
        navigator.clipboard.writeText(shareLink);
        alert(`“${folder.name}”的分享链接已生成并复制到剪贴板！\n链接: ${shareLink}`);
    }
  };

  if (store.view === 'external-share' && store.activeMeeting) {
    return (
      <ExternalShareView 
        meeting={store.activeMeeting} 
        templates={store.templates} 
        onExit={() => {
          store.setShareConfig(null);
          store.setView('detail');
        }} 
        shareConfig={store.shareConfig}
      />
    );
  }

  // Filter Logic: Folder + Search
  const filteredMeetings = store.meetings.filter(m => {
    const matchFolder = store.selectedFolderId ? m.folderId === store.selectedFolderId : true;
    const matchSearch = store.searchQuery 
      ? m.name.toLowerCase().includes(store.searchQuery.toLowerCase()) 
      : true;
    return matchFolder && matchSearch;
  });
    
  const meetingsToShow = [...filteredMeetings].sort((a, b) => 
    b.uploadDate.getTime() - a.uploadDate.getTime()
  );

  const currentFolderName = store.selectedFolderId 
    ? store.folders.find(f => f.id === store.selectedFolderId)?.name 
    : null;

  const activeHomeTemplate = homeSelectedTemplateId ? store.templates.find(t => t.id === homeSelectedTemplateId) : null;
  const TEMPLATE_CATEGORIES = ['通用', '会议', '演讲', '面试'];

  return (
    <>
      <input type="file" ref={fileInputRef} className="hidden" accept=".wav,.mp3" onChange={handleFileInputChange} />
      
      <GlobalModals 
        pendingFile={pendingFile}
        onConfirmUpload={handleConfirmUpload}
        onCancelUpload={() => setPendingFile(null)}
        
        isWebRecorderOpen={isWebRecorderOpen}
        onSaveRecording={handleSaveRecording}
        onCloseWebRecorder={() => setIsWebRecorderOpen(false)}
        
        isHardwareModalOpen={isHardwareModalOpen}
        hardwareConnectionState={hardwareConnectionState}
        deviceFiles={deviceFiles}
        onToggleHardwareFile={toggleFileSelection}
        onSyncHardware={handleSync}
        onCloseHardwareModal={closeSyncModal}
        
        activeHomeTemplate={store.view === 'home' ? activeHomeTemplate : null}
        templateCategories={TEMPLATE_CATEGORIES}
        onSaveTemplate={store.updateTemplate}
        onDeleteTemplate={(id) => {
           store.deleteTemplate(id);
           setHomeSelectedTemplateId(null);
        }}
        onCloseTemplateModal={() => setHomeSelectedTemplateId(null)}
      />

      {store.error && (
        <div className="bg-red-50 border-b border-red-200 p-3 text-red-700 text-sm flex items-center justify-center gap-2 animate-fade-in relative z-[60]">
           <AlertTriangle size={16} />
           <span className="font-bold">无法连接服务器:</span> {store.error} (请在 Supabase 后台运行迁移脚本)
        </div>
      )}

      <MainLayout
        currentView={store.view} 
        onChangeView={(view) => {
          setTargetTemplateId(null);
          store.setView(view);
        }}
        isHardwareConnecting={hardwareConnectionState === 'searching' || hardwareConnectionState === 'syncing'} 
        onConnectHardware={openSyncModal}
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
          {store.view === 'home' && (
            <HomeView 
              meetings={meetingsToShow} // Uses filtered list if search is active
              folders={store.folders}
              templates={store.templates} 
              onSelectMeeting={(id) => {
                setReturnView('home');
                store.accessMeeting(id);
              }}
              onSelectFolder={(id) => { 
                store.setSelectedFolderId(id); 
                store.setView('list'); 
                setNavSource('home');
              }}
              onSelectTemplate={setHomeSelectedTemplateId} 
              onViewMoreMeetings={() => { 
                store.setSelectedFolderId(null); 
                store.setView('list'); 
                setNavSource('home');
              }}
              onViewMoreTemplates={() => {
                setTargetTemplateId(null);
                store.setView('templates');
              }}
              onTriggerUpload={handleTriggerUpload}
              onTriggerHardwareSync={openSyncModal}
              onStartRecording={() => setIsWebRecorderOpen(true)}
              isHardwareSyncing={hardwareConnectionState === 'syncing'}
              onAddFolder={store.addFolder}
              onRenameFolder={store.updateFolder}
              onDeleteFolder={store.deleteFolder}
              onShareFolder={handleShareFolder}
              onDeleteMeeting={store.deleteMeeting}
              onMoveMeeting={store.moveMeetingToFolder}
              onRenameMeeting={(id, name) => store.updateMeeting(id, { name })}
              onToggleStar={store.toggleStarMeeting}
              onDuplicate={store.duplicateMeeting}
              onRetry={store.retryProcessMeeting}
              searchQuery={store.searchQuery}
              onSearchChange={store.setSearchQuery}
            />
          )}

          {store.view === 'list' && (
            <MeetingListView 
              meetings={meetingsToShow} 
              folders={store.folders}
              currentFolderName={currentFolderName}
              onTriggerUpload={handleTriggerUpload} 
              onTriggerHardwareSync={openSyncModal} 
              onStartRecording={() => setIsWebRecorderOpen(true)}
              isHardwareSyncing={hardwareConnectionState === 'syncing'} 
              onSelectMeeting={(id) => {
                setReturnView('list');
                store.accessMeeting(id);
              }}
              onDeleteMeeting={store.deleteMeeting}
              onMoveMeeting={store.moveMeetingToFolder}
              onRenameMeeting={(id, name) => store.updateMeeting(id, { name })}
              onClearFolder={() => store.setSelectedFolderId(null)}
              onBack={() => {
                  store.setSelectedFolderId(null);
                  store.setView('home');
              }}
              showBackButton={navSource === 'home'}
              selectedFolderId={store.selectedFolderId}
              onRenameFolder={store.updateFolder}
              onDeleteFolder={store.deleteFolder}
              onShareFolder={handleShareFolder}
              onToggleStar={store.toggleStarMeeting}
              onDuplicate={store.duplicateMeeting}
              onRetry={store.retryProcessMeeting}
              searchQuery={store.searchQuery}
              onSearchChange={store.setSearchQuery}
            />
          )}

          {store.view === 'detail' && store.activeMeeting && (
            <MeetingDetailView 
              meeting={store.activeMeeting}
              meetingList={meetingsToShow}
              onSelectMeeting={store.accessMeeting}
              templates={store.templates}
              voiceprints={store.voiceprints}
              onUpdate={(updates) => store.updateMeeting(store.activeMeeting!.id, updates)} 
              onBack={() => store.setView(returnView)} 
              onRegisterVoiceprint={store.addVoiceprint} 
              onPreviewShare={(config) => {
                store.setShareConfig(config);
                store.setView('external-share');
              }} 
            />
          )}

          {store.view === 'voiceprints' && (
            <VoiceprintManagerView 
              voiceprints={store.voiceprints} 
              onAdd={store.addVoiceprint} 
              onUpdate={store.updateVoiceprint} 
              onDelete={store.deleteVoiceprint} 
            />
          )}

          {store.view === 'hotwords' && (
            <HotwordManagerView 
              hotwords={store.hotwords} 
              onAdd={store.addHotword} 
              onUpdate={store.updateHotword} 
              onDelete={store.deleteHotword} 
            />
          )}

          {store.view === 'templates' && (
            <TemplateManagerView 
              templates={store.templates} 
              toggleStarTemplate={store.toggleStarTemplate} 
              onAdd={store.addTemplate} 
              onUpdate={store.updateTemplate} 
              onDelete={store.deleteTemplate} 
              initialSelectedId={targetTemplateId}
            />
          )}

          {store.view === 'recycle-bin' && (
            <RecycleBinView 
              deletedMeetings={store.deletedMeetings} 
              onRestore={store.restoreMeeting} 
              onPermanentDelete={store.permanentDeleteMeeting}
            />
          )}
      </MainLayout>
    </>
  );
};

export default AuthenticatedApp;
