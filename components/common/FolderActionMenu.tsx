
import React from 'react';
import { Share2, Edit2, Trash2 } from 'lucide-react';

interface FolderActionMenuProps {
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const FolderActionMenu: React.FC<FolderActionMenuProps> = ({
  onShare,
  onRename,
  onDelete,
  onClose
}) => {
  return (
    <div className="flex flex-col py-1">
      <button 
         onClick={(e) => { 
           e.stopPropagation(); 
           onShare(); 
           onClose(); 
         }}
         className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
      >
         <Share2 size={12} /> 分享
      </button>
      <button 
         onClick={(e) => { 
           e.stopPropagation(); 
           onRename(); 
           onClose(); 
         }}
         className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
      >
         <Edit2 size={12} /> 重命名
      </button>
      <div className="h-px bg-slate-50 my-0.5"></div>
      <button 
         onClick={(e) => { 
           e.stopPropagation(); 
           onDelete(); 
           onClose(); 
         }}
         className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
      >
         <Trash2 size={12} /> 删除
      </button>
    </div>
  );
};
