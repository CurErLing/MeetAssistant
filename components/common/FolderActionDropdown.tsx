
import React, { useState, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { FolderActionMenu } from './FolderActionMenu';
import { useClickOutside } from '../../hooks/useClickOutside';

interface FolderActionDropdownProps {
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
  className?: string; // Allow custom positioning classes
}

export const FolderActionDropdown: React.FC<FolderActionDropdownProps> = ({
  onShare,
  onRename,
  onDelete,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  return (
    <div ref={containerRef} className="relative">
      <button 
        onClick={(e) => {
           e.stopPropagation();
           setIsOpen(!isOpen);
        }}
        className={`p-1.5 rounded-md transition-colors ${isOpen ? 'text-slate-600 bg-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'} ${className}`}
      >
         <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-slide-up origin-top-right">
           <FolderActionMenu 
             onShare={onShare}
             onRename={onRename}
             onDelete={onDelete}
             onClose={() => setIsOpen(false)}
           />
        </div>
      )}
    </div>
  );
};
