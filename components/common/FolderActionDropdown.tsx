
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { FolderActionMenu } from './FolderActionMenu';
import { Dropdown } from './Dropdown';

interface FolderActionDropdownProps {
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
  className?: string;
}

export const FolderActionDropdown: React.FC<FolderActionDropdownProps> = ({
  onShare,
  onRename,
  onDelete,
  className = ""
}) => {
  return (
    <Dropdown
      className={className}
      trigger={(isOpen) => (
        <button 
          className={`p-1.5 rounded-md transition-colors ${isOpen ? 'text-slate-600 bg-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
        >
           <MoreHorizontal size={18} />
        </button>
      )}
      content={(close) => (
         <div className="w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
           <FolderActionMenu 
             onShare={onShare}
             onRename={onRename}
             onDelete={onDelete}
             onClose={close}
           />
         </div>
      )}
    />
  );
};
