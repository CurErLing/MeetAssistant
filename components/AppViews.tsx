
import React, { useState } from 'react';
import { HomeView } from './views/home';
import { MeetingListView } from './views/meeting-list';
import { MeetingDetailView } from './views/meeting';
import { VoiceprintManagerView } from './views/manager/VoiceprintManagerView';
import { HotwordManagerView } from './views/manager/HotwordManagerView';
import { TemplateManagerView } from './views/template';
import { RecycleBinView } from './views/recycle-bin';
import { ExternalShareView } from './views/external-share';

interface AppViewsProps {
  store: any;
  globalActions: any;
  setReturnView: (view: any) => void;
  returnView: any;
  setNavSource: (source: 'home' | 'sidebar') => void;
  navSource: 'home' | 'sidebar';
}

export const AppViews: React.FC<AppViewsProps> = ({ 
  store, 
  globalActions, 
  setReturnView, 
  returnView, 
  setNavSource,
  navSource
}) => {
  const [targetTemplateId, setTargetTemplateId] = useState<string | null>(null);
  const [homeSelectedTemplateId, setHomeSelectedTemplateId] = useState<string | null>(null);

  // --- External Share View ---
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

  // --- Filter Logic ---
  const filteredMeetings = store.meetings.filter((m: any) => {
    const matchFolder = store.selectedFolderId ? m.folderId === store.selectedFolderId : true;
    const matchSearch = store.searchQuery 
      ? m.name.toLowerCase().includes(store.searchQuery.toLowerCase()) 
      : true;
    return matchFolder && matchSearch;
  });
    
  const meetingsToShow = [...filteredMeetings].sort((a: any, b: any) => 
    b.uploadDate.getTime() - a.uploadDate.getTime()
  );

  const currentFolderName = store.selectedFolderId 
    ? store.folders.find((f: any) => f.id === store.selectedFolderId)?.name 
    : null;

  const handleShareFolder = (folderId: string) => {
    const folder = store.folders.find((f: any) => f.id === folderId);
    if (folder) {
        const shareLink = `https://jimumeeting.ai/share/folder/${folderId}`;
        navigator.clipboard.writeText(shareLink);
        alert(`“${folder.name}”的分享链接已生成并复制到剪贴板！\n链接: ${shareLink}`);
    }
  };

  // --- Render Views ---
  switch (store.view) {
    case 'home':
      return (
        <HomeView 
          meetings={meetingsToShow}
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
          onTriggerUpload={globalActions.handleTriggerUpload}
          onTriggerHardwareSync={globalActions.hardware.openSyncModal}
          onStartRecording={() => globalActions.setIsWebRecorderOpen(true)}
          isHardwareSyncing={globalActions.hardware.connectionState === 'syncing'}
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
      );

    case 'list':
      return (
        <MeetingListView 
          meetings={meetingsToShow} 
          folders={store.folders}
          currentFolderName={currentFolderName}
          onTriggerUpload={globalActions.handleTriggerUpload} 
          onTriggerHardwareSync={globalActions.hardware.openSyncModal} 
          onStartRecording={() => globalActions.setIsWebRecorderOpen(true)}
          isHardwareSyncing={globalActions.hardware.connectionState === 'syncing'} 
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
      );

    case 'detail':
      if (!store.activeMeeting) return null;
      return (
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
      );

    case 'voiceprints':
      return (
        <VoiceprintManagerView 
          voiceprints={store.voiceprints} 
          onAdd={store.addVoiceprint} 
          onUpdate={store.updateVoiceprint} 
          onDelete={store.deleteVoiceprint} 
        />
      );

    case 'hotwords':
      return (
        <HotwordManagerView 
          hotwords={store.hotwords} 
          onAdd={store.addHotword} 
          onUpdate={store.updateHotword} 
          onDelete={store.deleteHotword} 
        />
      );

    case 'templates':
      return (
        <TemplateManagerView 
          templates={store.templates} 
          toggleStarTemplate={store.toggleStarTemplate} 
          onAdd={store.addTemplate} 
          onUpdate={store.updateTemplate} 
          onDelete={store.deleteTemplate} 
          initialSelectedId={targetTemplateId}
        />
      );

    case 'recycle-bin':
      return (
        <RecycleBinView 
          deletedMeetings={store.deletedMeetings} 
          onRestore={store.restoreMeeting} 
          onPermanentDelete={store.permanentDeleteMeeting}
        />
      );

    default:
      return null;
  }
};
