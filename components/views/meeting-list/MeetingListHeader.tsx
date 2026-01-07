
import React, { useState, useRef } from 'react';
import { ArrowLeft, MoreHorizontal, Edit2, Trash2, Share2 } from 'lucide-react';
import { MeetingActionToolbar } from '../../MeetingActionToolbar';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { SearchBar } from '../../common/SearchBar';

interface MeetingListHeaderProps {
  currentFolderName: string | null;
  meetingsCount: number;
  onClearFolder: () => void;
  onBack: () => void;
  onTriggerUpload: () => void;
  onTriggerHardwareSync: () => void;
  onStartRecording: () => void;
  isHardwareSyncing: boolean;
  showBackButton?: boolean;
  onRenameFolder?: () => void;
  onDeleteFolder?: () => void;
  onShareFolder?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const MeetingListHeader: React.FC<MeetingListHeaderProps> = ({
  currentFolderName,
  meetingsCount,
  onClearFolder,
  onBack,
  onTriggerUpload,
  onTriggerHardwareSync,
  onStartRecording,
  isHardwareSyncing,
  showBackButton = false,
  onRenameFolder,
  onDeleteFolder,
  onShareFolder,
  searchQuery,
  onSearchChange
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(menuRef, () => setIsMenuOpen(false), isMenuOpen);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
         {showBackButton ? (
            <button 
              onClick={onBack}
              className="mt-1 p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0"
              title="返回主页"
            >
              <ArrowLeft size={24} />
            </button>
         ) : null}
         
         <div className="min-w-0 flex items-center gap-2">
            <div className="min-w-0">
               {currentFolderName ? (
                  // Folder View Header
                  <div>
                     <h2 className="text-2xl font-bold text-slate-900 tracking-tight truncate pr-2">
                       {currentFolderName}
                     </h2>
                     <p className="text-slate-500 mt-1 text-sm">文件夹内共有 {meetingsCount} 个文档</p>
                  </div>
               ) : (
                  // All Files Header
                  <div>
                     <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                       全部会议
                     </h2>
                     <p className="text-slate-500 mt-1 text-sm">管理您的录音和转写记录 ({meetingsCount})</p>
                  </div>
               )}
            </div>

            {/* Folder Actions Menu */}
            {currentFolderName && onRenameFolder && onDeleteFolder && (
               <div className="relative flex-shrink-0 self-start mt-1" ref={menuRef}>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                     <MoreHorizontal size={20} />
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute left-0 sm:left-auto top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 animate-slide-up origin-top-left sm:origin-top-left">
                        {onShareFolder && (
                           <button 
                              onClick={() => { onShareFolder(); setIsMenuOpen(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                           >
                              <Share2 size={12} /> 分享
                           </button>
                        )}
                        <button 
                           onClick={() => { onRenameFolder(); setIsMenuOpen(false); }}
                           className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                           <Edit2 size={12} /> 重命名
                        </button>
                        <div className="h-px bg-slate-50 my-0.5"></div>
                        <button 
                           onClick={() => { onDeleteFolder(); setIsMenuOpen(false); }}
                           className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                           <Trash2 size={12} /> 删除
                        </button>
                    </div>
                  )}
               </div>
            )}
         </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
         <SearchBar 
           placeholder="搜索会议..." 
           value={searchQuery}
           onChange={(e) => onSearchChange(e.target.value)}
           containerClassName="w-full sm:w-64"
         />
         <MeetingActionToolbar 
           onTriggerHardwareSync={onTriggerHardwareSync}
           onTriggerUpload={onTriggerUpload}
           onStartRecording={onStartRecording}
           isHardwareSyncing={isHardwareSyncing}
           className="w-full sm:w-auto"
         />
      </div>
    </div>
  );
};
