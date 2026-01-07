
import React from 'react';
import { Folder as FolderIcon, Plus } from 'lucide-react';
import { Folder } from '../../../types';
import { FolderActionDropdown } from '../../common/FolderActionDropdown';

interface HomeFolderSectionProps {
  folders: Folder[];
  onSelectFolder: (id: string) => void;
  onRequestCreate: () => void;
  onRequestRename: (folder: Folder) => void;
  onRequestDelete: (folderId: string) => void;
  onRequestShare: (folderId: string) => void;
}

export const HomeFolderSection: React.FC<HomeFolderSectionProps> = ({
  folders,
  onSelectFolder,
  onRequestCreate,
  onRequestRename,
  onRequestDelete,
  onRequestShare
}) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <FolderIcon size={18} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">我的项目</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
         {/* New Folder Card */}
         <button
            onClick={onRequestCreate}
            className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group flex flex-col items-center justify-center h-32 sm:h-36 gap-3"
         >
            <div className="w-10 h-10 bg-white text-slate-300 rounded-lg flex items-center justify-center shadow-sm group-hover:text-blue-500 transition-colors">
               <Plus size={24} />
            </div>
            <div className="font-bold text-slate-400 group-hover:text-blue-600 transition-colors text-sm">新建文件夹</div>
         </button>

         {folders.map(folder => (
            <div 
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 hover:scale-[1.02] transition-all cursor-pointer group flex flex-col justify-between h-32 sm:h-36 relative"
            >
               <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <FolderIcon size={20} />
                  </div>
                  
                  {/* Action Dropdown */}
                  <div className="-mr-2 -mt-2">
                     <FolderActionDropdown 
                        onShare={() => onRequestShare(folder.id)}
                        onRename={() => onRequestRename(folder)}
                        onDelete={() => onRequestDelete(folder.id)}
                        className="opacity-0 group-hover:opacity-100"
                     />
                  </div>
               </div>
               
               <div>
                  <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate pr-4">{folder.name}</div>
                  <div className="text-slate-400 text-xs mt-1">{folder.meetingIds.length} 个文件</div>
               </div>
            </div>
         ))}
      </div>
    </section>
  );
};
