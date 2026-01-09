
import React, { useState } from 'react';
import { 
  Mic, Trash2, Folder as FolderIcon, Home, Menu, User
} from 'lucide-react';
import { ViewState, Folder } from '../../types';
import { SidebarNavItem } from './SidebarNavItem';
import { FolderSection } from './FolderSection';
import { KnowledgeSection } from './KnowledgeSection';
import { SidebarFooter } from './SidebarFooter';
import { Drawer } from '../common/Drawer';

interface SidebarProps {
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
  onProfileClick?: () => void;
  userName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView, onChangeView, isHardwareConnecting, onConnectHardware,
  meetingsCount, deletedCount, folders, onAddFolder, selectedFolderId, onSelectFolder,
  onRenameFolder, onDeleteFolder, onShareFolder, onProfileClick,
  userName
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(true);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(true);

  const handleViewChange = (view: ViewState) => {
    if (view === 'home') onSelectFolder(null);
    onChangeView(view);
    setIsMobileMenuOpen(false);
  };

  const handleFolderSelect = (id: string) => {
    onSelectFolder(id);
    onChangeView('list');
    setIsMobileMenuOpen(false);
  };

  // Sidebar Content Logic
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
        <div className="h-16 flex items-center px-6 border-b border-slate-50 flex-shrink-0">
           <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-md shadow-blue-200">
              <Mic size={22} />
           </div>
           <h1 className="text-lg font-bold text-slate-900 tracking-tight">积木会议助手</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {/* 1. Home */}
          <SidebarNavItem 
            icon={<Home size={20} />} 
            label="主页" 
            isActive={currentView === 'home'} 
            onClick={() => handleViewChange('home')} 
          />

          {/* 2. All Files */}
          <SidebarNavItem 
              icon={<FolderIcon size={20} />} 
              label="全部会议" 
              isActive={(currentView === 'list' || currentView === 'detail') && !selectedFolderId} 
              onClick={() => { 
                onSelectFolder(null); 
                handleViewChange('list');
              }} 
              count={meetingsCount} 
            />

          {/* 3. Recycle Bin (Moved here) */}
          <SidebarNavItem 
            icon={<Trash2 size={20} />} 
            label="回收站" 
            isActive={currentView === 'recycle-bin'} 
            onClick={() => handleViewChange('recycle-bin')} 
            count={deletedCount} 
          />

          {/* 4. Folders */}
          <FolderSection 
             folders={folders}
             selectedFolderId={selectedFolderId}
             onSelectFolder={handleFolderSelect}
             onAddFolder={onAddFolder}
             onRenameFolder={onRenameFolder}
             onDeleteFolder={onDeleteFolder}
             onShareFolder={onShareFolder}
             isOpen={isFolderOpen}
             onToggle={setIsFolderOpen}
          />

          {/* 5. Knowledge Base (Templates, Voiceprints, Hotwords) */}
          <KnowledgeSection 
            currentView={currentView}
            onChangeView={handleViewChange}
            isOpen={isKnowledgeOpen}
            onToggle={setIsKnowledgeOpen}
          />
        </nav>

        <SidebarFooter 
          isHardwareConnecting={isHardwareConnecting}
          onConnectHardware={onConnectHardware}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          onProfileClick={onProfileClick}
          userName={userName}
        />
    </div>
  );

  return (
    <>
      {/* 移动端顶部导航 (Header only) */}
      <div className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-40 w-full">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Mic size={16} /></div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">积木会议助手</h1>
            </div>
          </div>
          <button 
            className="p-2 text-slate-500" 
            onClick={() => {
              if (onProfileClick) onProfileClick();
            }}
          >
            <User size={20} />
          </button>
        </div>
      </div>

      {/* 移动端侧边栏抽屉 (Drawer) */}
      <Drawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
         <SidebarContent />
      </Drawer>

      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0 z-20 h-screen sticky top-0">
         <SidebarContent />
      </aside>
    </>
  );
};
