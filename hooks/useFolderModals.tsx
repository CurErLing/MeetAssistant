
import React, { useState } from 'react';
import { Folder as FolderIcon } from 'lucide-react';
import { Folder } from '../types';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { InputModal } from '../components/modals/InputModal';

interface FolderActions {
  addFolder: (name: string) => void;
  renameFolder?: (id: string, name: string) => void;
  deleteFolder?: (id: string) => void;
  shareFolder?: (id: string) => void;
}

export const useFolderModals = (actions: FolderActions, folders: Folder[]) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [folderToDeleteId, setFolderToDeleteId] = useState<string | null>(null);
  const [folderToShareId, setFolderToShareId] = useState<string | null>(null);

  const getFolderNameById = (id: string) => folders.find(f => f.id === id)?.name || '';

  const openCreateDialog = () => setIsCreatingFolder(true);
  const openRenameDialog = (folder: Folder) => setFolderToRename(folder);
  const openDeleteDialog = (id: string) => setFolderToDeleteId(id);
  const openShareDialog = (id: string) => setFolderToShareId(id);

  const FolderModals = () => (
    <>
      {isCreatingFolder && (
        <InputModal 
          isOpen={true}
          onClose={() => setIsCreatingFolder(false)}
          title={
            <>
              <FolderIcon size={20} className="text-blue-600" />
              <span>新建文件夹</span>
            </>
          }
          label="文件夹名称"
          initialValue=""
          placeholder="例如：2024 年度规划"
          onConfirm={(name) => {
            actions.addFolder(name);
            setIsCreatingFolder(false);
          }}
        />
      )}

      {folderToRename && actions.renameFolder && (
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
          onConfirm={(newName) => actions.renameFolder!(folderToRename!.id, newName)}
        />
      )}

      {folderToDeleteId && actions.deleteFolder && (
         <ConfirmModal 
           isOpen={true}
           onClose={() => setFolderToDeleteId(null)}
           onConfirm={() => {
             actions.deleteFolder!(folderToDeleteId!);
             setFolderToDeleteId(null);
           }}
           title="删除文件夹"
           description="您确定要删除此文件夹吗？文件夹内的所有文档将被移至“未分类”，不会被删除。"
           confirmText="删除"
           variant="danger"
         />
      )}

      {folderToShareId && actions.shareFolder && (
        <ConfirmModal 
          isOpen={true}
          onClose={() => setFolderToShareId(null)}
          onConfirm={() => {
             actions.shareFolder!(folderToShareId!);
             setFolderToShareId(null);
           }}
          title="分享文件夹"
          description={`您确定要分享文件夹“${getFolderNameById(folderToShareId!)}”吗？生成链接后，获得链接的用户将可以访问该文件夹内的所有会议记录。`}
          confirmText="确认分享"
          variant="primary"
        />
      )}
    </>
  );

  return {
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    openShareDialog,
    FolderModals
  };
};
