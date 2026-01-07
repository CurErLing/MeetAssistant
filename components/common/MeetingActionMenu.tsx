
import React from 'react';
import { Edit2, FolderClosed, Trash2, Star, Copy, RotateCcw } from 'lucide-react';

interface MeetingActionMenuProps {
  status: string;
  isStarred?: boolean;
  onAction: (action: 'rename' | 'move' | 'delete' | 'toggleStar' | 'duplicate' | 'retry') => void;
  layout?: 'desktop' | 'mobile';
}

export const MeetingActionMenu: React.FC<MeetingActionMenuProps> = ({ status, isStarred, onAction, layout = 'desktop' }) => {
  const baseButtonClass = "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors";
  const defaultTextClass = "text-slate-700 hover:bg-slate-50";
  const dangerTextClass = "text-red-600 hover:bg-red-50";
  const iconSize = layout === 'mobile' ? 14 : 16;
  const iconGap = layout === 'mobile' ? 'gap-2' : 'gap-3';

  if (status === 'processing') {
    return (
      <div className={`bg-white rounded-xl shadow-2xl border border-slate-100 py-1 overflow-hidden z-[50] ${layout === 'mobile' ? 'w-48' : 'w-52'}`}>
         <div className="px-4 py-3 text-xs text-slate-400 text-center">
            正在处理中...
         </div>
         <div className="h-px bg-slate-100 mx-2 my-1"></div>
         <button 
           onClick={(e) => { e.stopPropagation(); onAction('delete'); }}
           className={`${baseButtonClass} ${iconGap} ${dangerTextClass}`}
         >
            <Trash2 size={iconSize} className="text-red-400" />
            取消并删除
         </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-2xl border border-slate-100 py-1 overflow-hidden animate-slide-up origin-top-right z-[50] ${layout === 'mobile' ? 'w-48' : 'w-52'}`}>
       {status === 'error' && (
         <button 
           onClick={(e) => { e.stopPropagation(); onAction('retry'); }}
           className={`${baseButtonClass} ${iconGap} text-blue-600 hover:bg-blue-50 font-medium border-b border-slate-50`}
         >
            <RotateCcw size={iconSize} className="text-blue-500" />
            重试转写
         </button>
       )}
       
       <button 
         onClick={(e) => { e.stopPropagation(); onAction('toggleStar'); }}
         className={`${baseButtonClass} ${iconGap} ${defaultTextClass} ${layout === 'mobile' ? 'border-b border-slate-50' : ''}`}
       >
          <Star size={iconSize} className={isStarred ? "text-amber-400 fill-amber-400" : "text-slate-400"} />
          {isStarred ? '取消收藏' : '收藏会议'}
       </button>
       <button 
         onClick={(e) => { e.stopPropagation(); onAction('duplicate'); }}
         className={`${baseButtonClass} ${iconGap} ${defaultTextClass} ${layout === 'mobile' ? 'border-b border-slate-50' : ''}`}
       >
          <Copy size={iconSize} className="text-slate-400" />
          创建副本
       </button>
       <div className="h-px bg-slate-100 mx-2 my-1"></div>
       <button 
         onClick={(e) => { e.stopPropagation(); onAction('rename'); }}
         className={`${baseButtonClass} ${iconGap} ${defaultTextClass} ${layout === 'mobile' ? 'border-b border-slate-50' : ''}`}
       >
          <Edit2 size={iconSize} className="text-slate-400" />
          重命名
       </button>
       <button 
         onClick={(e) => { e.stopPropagation(); onAction('move'); }}
         className={`${baseButtonClass} ${iconGap} ${defaultTextClass} ${layout === 'mobile' ? 'border-b border-slate-50' : ''}`}
       >
          <FolderClosed size={iconSize} className="text-slate-400" />
          移至文件夹
       </button>
       <div className="h-px bg-slate-100 mx-2 my-1"></div>
       <button 
         onClick={(e) => { e.stopPropagation(); onAction('delete'); }}
         className={`${baseButtonClass} ${iconGap} ${dangerTextClass}`}
       >
          <Trash2 size={iconSize} className="text-red-400" />
          移至回收站
       </button>
    </div>
  );
};
