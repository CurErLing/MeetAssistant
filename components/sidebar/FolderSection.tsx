
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Folder as FolderIcon, Check } from 'lucide-react';
import { Folder } from '../../types';
import { SidebarNavItem } from './SidebarNavItem';
import { InputModal } from '../modals/InputModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { useClickOutside } from '../../hooks/useClickOutside';
import { FolderActionDropdown } from '../common/FolderActionDropdown';

interface FolderSectionProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onAddFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onShareFolder: (id: string) => void;
}

export const FolderSection: React.FC<FolderSectionProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onShareFolder
}) => {
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Modal State
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [folderToDeleteId, setFolderToDeleteId] = useState<string | null>(null);
  const [folderToShareId, setFolderToShareId] = useState<string | null>(null);
  
  const folderInputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showFolderInput) folderInputRef.current?.focus();
  }, [showFolderInput]);

  useClickOutside(inputContainerRef, () => setShowFolderInput(false), showFolderInput);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setShowFolderInput(false);
    }
  };

  const getFolderNameById = (id: string) => folders.find(f => f.id === id)?.name || '';

  return (
    <div className="mt-8 relative">
      {/* --- Modals --- */}
      {folderToRename && (
        <InputModal 
          isOpen={true}
          onClose={() => setFolderToRename(null)}
          title={
            <>
              <FolderIcon size={20} className="text-blue-600" />
              <span>重命名文件夹</span>
            </>
          }
          label="文件夹名称"
          initialValue={folderToRename.name}
          onConfirm={(newName) => {
             onRenameFolder(folderToRename.id, newName);
             setFolderToRename(null);
          }}
        />
      )}

      {folderToDeleteId && (
        <ConfirmModal 
          isOpen={true}
          onClose={() => setFolderToDeleteId(null)}
          onConfirm={() => {
             onDeleteFolder(folderToDeleteId);
             setFolderToDeleteId(null);
           }}
          title="删除文件夹"
          description="您确定要删除此文件夹吗？文件夹内的所有文档将被移至“未分类”，不会被删除。"
          confirmText="删除"
          variant="danger"
        />
      )}

      {folderToShareId && (
        <ConfirmModal 
          isOpen={true}
          onClose={() => setFolderToShareId(null)}
          onConfirm={() => {
             onShareFolder(folderToShareId);
             setFolderToShareId(null);
           }}
          title="分享文件夹"
          description={`您确定要分享文件夹“${getFolderNameById(folderToShareId)}”吗？生成链接后，获得链接的用户将可以访问该文件夹内的所有会议记录。`}
          confirmText="确认分享"
          variant="primary"
        />
      )}

      {/* --- Header --- */}
      <div className="flex items-center justify-between px-3 py-2 group cursor-pointer" onClick={() => setIsFoldersOpen(!isFoldersOpen)}>
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-slate-500">文件夹</span>
          {isFoldersOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowFolderInput(!showFolderInput); setNewFolderName(''); }} 
          className={`p-1 rounded transition-colors ${showFolderInput ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <Plus size={18} />
        </button>
      </div>
      
      {showFolderInput && (
        <div ref={inputContainerRef} className="absolute right-0 top-10 z-50 w-full bg-white rounded-xl shadow-xl border border-slate-200 p-3 animate-slide-up">
          <div className="flex flex-col gap-2">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">新建文件夹</div>
             <div className="flex gap-1.5">
               <input 
                 ref={folderInputRef} 
                 className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" 
                 placeholder="文件夹名称..." 
                 value={newFolderName} 
                 onChange={(e) => setNewFolderName(e.target.value)} 
                 onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()} 
               />
               <button 
                 onClick={handleAddFolder} 
                 className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50" 
                 disabled={!newFolderName.trim()}
               >
                 <Check size={14} />
               </button>
             </div>
          </div>
        </div>
      )}
      
      {isFoldersOpen && (
        <div className="mt-2 space-y-1 animate-fade-in pl-1">
          {folders.length > 0 ? folders.map(f => {
            return (
              <SidebarNavItem 
                key={f.id} 
                icon={<FolderIcon size={18} />} 
                label={f.name} 
                isActive={selectedFolderId === f.id} 
                onClick={() => onSelectFolder(f.id)} 
                count={f.meetingIds.length} 
                actions={
                  <div className="relative">
                    <FolderActionDropdown 
                        onShare={() => setFolderToShareId(f.id)}
                        onRename={() => setFolderToRename(f)}
                        onDelete={() => setFolderToDeleteId(f.id)}
                        className={selectedFolderId === f.id ? 'text-slate-500 hover:bg-slate-200' : ''}
                    />
                  </div>
                }
              />
            );
          }) : <div className="px-10 py-4 text-xs text-slate-400 italic">暂无文件夹</div>}
        </div>
      )}
    </div>
  );
};
