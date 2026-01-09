
import React, { useState, useRef, useMemo } from 'react';
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
import { ProfileView } from './components/views/profile/ProfileView';
import { AuthView } from './components/views/auth/AuthView';
import { GlobalModals } from './components/GlobalModals';
import { MainLayout } from './components/layout/MainLayout';
import { ToastProvider, useToast } from './components/common/Toast';
import { ViewState, MeetingFile, Folder, Speaker } from './types';

// Create an inner component to use the useToast hook
const AppContent = () => {
  const store = useAppStore();
  const toast = useToast();
  
  // Navigation State
  const [navSource, setNavSource] = useState<'home' | 'sidebar'>('sidebar');
  const [returnView, setReturnView] = useState<ViewState>('list');

  // Local UI State
  const [isWebRecorderOpen, setIsWebRecorderOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileSource, setPendingFileSource] = useState<'upload' | 'hardware'>('upload'); 
  const [targetTemplateId, setTargetTemplateId] = useState<string | null>(null);
  const [homeSelectedTemplateId, setHomeSelectedTemplateId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardware Sync Hook
  const {
    isModalOpen: isHardwareModalOpen,
    connectionState: hardwareConnectionState,
    deviceFiles,
    deviceStatus,
    transferProgress,
    transferTime,
    openSyncModal,
    closeSyncModal,
    toggleFileSelection,
    handleSync
  } = useHardwareSync(
    (file, context) => {
      // If batch import, create immediately without preview
      if (context.isBatch) {
        store.createMeeting(file, 0, 0, 'hardware');
      } else {
        // If single file, show preview modal
        setPendingFileSource('hardware');
        setPendingFile(file);
      }
    },
    () => {
      // Do not reset folder selection here, stay in current context
      store.setView('list');
    }
  );

  // Handlers
  const handleTriggerUpload = () => fileInputRef.current?.click();
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPendingFileSource('upload');
      setPendingFile(e.target.files[0]);
    }
    e.target.value = '';
  };
  
  const handleConfirmUpload = (file: File, trimStart: number, trimEnd: number) => { 
    if (file) { 
      // Use the tracked source
      store.createMeeting(file, trimStart, trimEnd, pendingFileSource); 
      setPendingFile(null);
      // Do not reset folder selection, keep user in current folder if set
      store.setView('list'); 
      toast.success('文件已导入并开始处理');
    } 
  };

  const handleSaveRecording = (file: File) => {
    store.createMeeting(file, 0, 0, 'recording');
    setIsWebRecorderOpen(false);
    store.setView('list');
    toast.success('录音已保存并开始处理');
  };

  const handleShareFolder = (folderId: string) => {
    const folder = store.folders.find((f) => f.id === folderId);
    if (folder) {
        const shareLink = `https://jimumeeting.ai/share/folder/${folderId}`;
        navigator.clipboard.writeText(shareLink);
        toast.success(`分享链接已复制: ${(folder as Folder).name}`);
    }
  };

  // --- Search & Filter Logic ---
  const filteredMeetings = useMemo(() => {
    const query = store.searchQuery.trim().toLowerCase();
    
    // 1. First Pass: Create a shallow copy with match snippets if needed
    const processedMeetings = store.meetings.map((m: MeetingFile) => {
      // If no query, return original (no snippet)
      if (!query) return { ...m, matchSnippet: undefined };

      // Check Title
      if (m.name.toLowerCase().includes(query)) {
        return m; // Match in title, no snippet needed (or could add "Title Match")
      }

      // Check Transcript Content
      if (m.transcript) {
        for (const seg of m.transcript) {
          const text = seg.text.toLowerCase();
          const idx = text.indexOf(query);
          if (idx !== -1) {
            // Found a match, extract snippet
            // Get ~15 chars before and ~30 chars after
            const start = Math.max(0, idx - 15);
            const end = Math.min(text.length, idx + query.length + 30);
            let snippet = seg.text.substring(start, end);
            
            // Add ellipsis if truncated
            if (start > 0) snippet = "..." + snippet;
            if (end < text.length) snippet = snippet + "...";
            
            return { ...m, matchSnippet: snippet };
          }
        }
      }

      return m; // No match found in transcript
    });

    // 2. Second Pass: Filter based on Folder and Search Match
    return processedMeetings.filter(m => {
      // Folder Filter
      const matchFolder = store.selectedFolderId ? m.folderId === store.selectedFolderId : true;
      
      // Search Filter
      // We check if name matched OR if we generated a snippet (implying transcript matched)
      // We also check speaker names as a bonus
      const matchSearch = !query || 
                          m.name.toLowerCase().includes(query) || 
                          !!m.matchSnippet ||
                          Object.values(m.speakers).some((s: Speaker) => s.name.toLowerCase().includes(query));

      return matchFolder && matchSearch;
    });
  }, [store.meetings, store.searchQuery, store.selectedFolderId]);

  const meetingsToShow = [...filteredMeetings].sort((a, b) => 
    b.uploadDate.getTime() - a.uploadDate.getTime()
  );

  const currentFolderName = store.selectedFolderId 
    ? store.folders.find(f => f.id === store.selectedFolderId)?.name 
    : null;

  const activeHomeTemplate = homeSelectedTemplateId ? store.templates.find(t => t.id === homeSelectedTemplateId) : null;
  const TEMPLATE_CATEGORIES = ['通用', '会议', '演讲', '面试'];

  // --- Auth & Loading Guards ---

  if (store.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!store.userId) {
    return <AuthView onLogin={store.login} />;
  }

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
        deviceStatus={deviceStatus}
        transferProgress={transferProgress}
        transferTime={transferTime}
        onToggleHardwareFile={toggleFileSelection}
        onSyncHardware={handleSync}
        onCloseHardwareModal={closeSyncModal}
        
        activeHomeTemplate={store.view === 'home' ? activeHomeTemplate : null}
        templateCategories={TEMPLATE_CATEGORIES}
        onSaveTemplate={(id, updates) => {
           store.updateTemplate(id, updates);
           toast.success("模板已更新");
        }}
        onDeleteTemplate={(id) => {
           store.deleteTemplate(id);
           setHomeSelectedTemplateId(null);
           toast.success("模板已删除");
        }}
        onCloseTemplateModal={() => setHomeSelectedTemplateId(null)}
      />

      <MainLayout
        currentView={store.view} 
        onChangeView={(view) => {
          setTargetTemplateId(null);
          store.setSearchQuery(""); // Reset search when changing main view
          store.setView(view);
        }}
        isHardwareConnecting={hardwareConnectionState === 'searching' || hardwareConnectionState === 'syncing'} 
        onConnectHardware={openSyncModal}
        meetingsCount={store.meetings.length}
        deletedCount={store.deletedMeetings.length}
        folders={store.folders}
        onAddFolder={(name) => {
           store.addFolder(name);
           toast.success(`文件夹 "${name}" 已创建`);
        }}
        selectedFolderId={store.selectedFolderId}
        onSelectFolder={(id) => {
          store.setSearchQuery(""); // Reset search when selecting sidebar folder
          store.setSelectedFolderId(id);
          setNavSource('sidebar');
        }}
        onRenameFolder={(id, name) => {
           store.updateFolder(id, name);
           toast.success("文件夹重命名成功");
        }}
        onDeleteFolder={(id) => {
           store.deleteFolder(id);
           toast.success("文件夹已删除");
        }}
        onShareFolder={handleShareFolder}
        onProfileClick={() => {
          store.setSearchQuery(""); // Reset search when going to profile
          store.setView('profile');
          store.setSelectedFolderId(null);
        }}
        userName={store.userName}
      >
          {store.view === 'home' && (
            <HomeView 
              userName={store.userName}
              meetings={meetingsToShow} 
              folders={store.folders}
              templates={store.templates} 
              onSelectMeeting={(id) => {
                setReturnView('home');
                store.accessMeeting(id);
              }}
              onSelectFolder={(id) => { 
                store.setSearchQuery(""); // Reset search
                store.setSelectedFolderId(id); 
                store.setView('list'); 
                setNavSource('home');
              }}
              onSelectTemplate={setHomeSelectedTemplateId} 
              onViewMoreMeetings={() => { 
                store.setSearchQuery(""); // Reset search
                store.setSelectedFolderId(null); 
                store.setView('list'); 
                setNavSource('home');
              }}
              onViewMoreTemplates={() => {
                store.setSearchQuery(""); // Reset search
                setTargetTemplateId(null);
                store.setView('templates');
              }}
              onTriggerUpload={handleTriggerUpload}
              onTriggerHardwareSync={openSyncModal}
              onStartRecording={() => setIsWebRecorderOpen(true)}
              isHardwareSyncing={hardwareConnectionState === 'syncing'}
              onAddFolder={(name) => {
                 store.addFolder(name);
                 toast.success(`文件夹 "${name}" 已创建`);
              }}
              onRenameFolder={(id, name) => {
                 store.updateFolder(id, name);
                 toast.success("文件夹重命名成功");
              }}
              onDeleteFolder={(id) => {
                 store.deleteFolder(id);
                 toast.success("文件夹已删除");
              }}
              onShareFolder={handleShareFolder}
              onDeleteMeeting={(id) => {
                 store.deleteMeeting(id);
                 toast.success("已移至回收站");
              }}
              onMoveMeeting={(id, fid) => {
                 store.moveMeetingToFolder(id, fid);
                 toast.success("移动成功");
              }}
              onRenameMeeting={(id, name) => {
                 store.updateMeeting(id, { name });
                 toast.success("重命名成功");
              }}
              onToggleStar={store.toggleStarMeeting}
              onDuplicate={(id) => {
                 store.duplicateMeeting(id);
                 toast.success("副本创建成功");
              }}
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
              onDeleteMeeting={(id) => {
                 store.deleteMeeting(id);
                 toast.success("已移至回收站");
              }}
              onMoveMeeting={(id, fid) => {
                 store.moveMeetingToFolder(id, fid);
                 toast.success("移动成功");
              }}
              onRenameMeeting={(id, name) => {
                 store.updateMeeting(id, { name });
                 toast.success("重命名成功");
              }}
              onClearFolder={() => store.setSelectedFolderId(null)}
              onBack={() => {
                  store.setSearchQuery(""); // Reset search on back
                  store.setSelectedFolderId(null);
                  store.setView('home');
              }}
              showBackButton={navSource === 'home'}
              selectedFolderId={store.selectedFolderId}
              onRenameFolder={(id, name) => {
                 store.updateFolder(id, name);
                 toast.success("文件夹重命名成功");
              }}
              onDeleteFolder={(id) => {
                 store.deleteFolder(id);
                 toast.success("文件夹已删除");
              }}
              onShareFolder={handleShareFolder}
              onToggleStar={store.toggleStarMeeting}
              onDuplicate={(id) => {
                 store.duplicateMeeting(id);
                 toast.success("副本创建成功");
              }}
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
              onRegisterVoiceprint={(name) => {
                 store.addVoiceprint(name);
                 toast.success(`声纹 "${name}" 注册成功`);
              }} 
              onPreviewShare={(config) => {
                store.setShareConfig(config);
                store.setView('external-share');
              }} 
            />
          )}

          {store.view === 'voiceprints' && (
            <VoiceprintManagerView 
              voiceprints={store.voiceprints} 
              onAdd={(name, file) => {
                 store.addVoiceprint(name, file);
                 toast.success(`声纹 "${name}" 添加成功`);
              }} 
              onUpdate={(id, name, file) => {
                 store.updateVoiceprint(id, name, file);
                 toast.success("声纹信息更新成功");
              }} 
              onDelete={(id) => {
                 store.deleteVoiceprint(id);
                 toast.success("声纹已删除");
              }} 
            />
          )}

          {store.view === 'hotwords' && (
            <HotwordManagerView 
              hotwords={store.hotwords} 
              onAdd={(w, c) => {
                 store.addHotword(w, c);
                 toast.success(`热词 "${w}" 添加成功`);
              }} 
              onUpdate={(id, w, c) => {
                 store.updateHotword(id, w, c);
                 toast.success("热词更新成功");
              }} 
              onDelete={(id) => {
                 store.deleteHotword(id);
                 toast.success("热词已删除");
              }} 
            />
          )}

          {store.view === 'templates' && (
            <TemplateManagerView 
              templates={store.templates} 
              toggleStarTemplate={store.toggleStarTemplate} 
              onAdd={(t) => {
                 store.addTemplate(t);
                 toast.success(`模版 "${t.name}" 已添加`);
              }} 
              onUpdate={(id, u) => {
                 store.updateTemplate(id, u);
                 toast.success("模版更新成功");
              }} 
              onDelete={(id) => {
                 store.deleteTemplate(id);
                 toast.success("模版已删除");
              }} 
              initialSelectedId={targetTemplateId}
            />
          )}

          {store.view === 'recycle-bin' && (
            <RecycleBinView 
              deletedMeetings={store.deletedMeetings} 
              onRestore={(id) => {
                 store.restoreMeeting(id);
                 toast.success("会议已还原");
              }} 
              onPermanentDelete={(id) => {
                 store.permanentDeleteMeeting(id);
                 toast.success("已彻底删除");
              }}
              onEmptyRecycleBin={() => {
                 store.emptyRecycleBin();
                 toast.success("回收站已清空");
              }}
            />
          )}

          {store.view === 'profile' && (
            <ProfileView 
              userId={store.userId || ''}
              userName={store.userName}
              onUpdateName={(name) => {
                 store.updateUserName(name);
                 toast.success("昵称修改成功");
              }}
              onLogout={store.logout}
            />
          )}
      </MainLayout>
    </>
  );
};

const App = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
