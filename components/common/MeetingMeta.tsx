
import React from 'react';
import { Cpu, Users, Star, Folder, Inbox, Search } from 'lucide-react';
import { MeetingFile, Folder as FolderType } from '../../types';
import { MeetingIcon } from './MeetingIcon';

interface MeetingMetaProps {
  meeting: MeetingFile;
  folder?: FolderType;
  isProcessing?: boolean;
  className?: string;
  showFormatInfo?: boolean; // 是否显示下方的格式和文件夹信息行
}

export const MeetingMeta: React.FC<MeetingMetaProps> = ({ 
  meeting, 
  folder, 
  isProcessing = false, 
  className = "",
  showFormatInfo = true
}) => {
  const isHardware = meeting.name.toLowerCase().startsWith('hardware') || meeting.id.includes('hardware');
  const folderName = folder ? folder.name : '未分类';
  const isUncategorized = !folder;

  return (
    <div className={`flex items-start gap-3 min-w-0 ${className}`}>
      <MeetingIcon 
        format={meeting.format} 
        status={meeting.status} 
        size={showFormatInfo ? 20 : 18} 
        className={showFormatInfo ? "" : "w-9 h-9 rounded-lg"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className={`font-medium text-sm transition-colors truncate ${isProcessing ? 'text-slate-400' : 'text-slate-900 group-hover:text-blue-600'}`}>
            {meeting.name}
          </div>
          {isHardware && (
            <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
              <Cpu size={10} />
              {showFormatInfo && <span className="hidden sm:inline ml-0.5">硬件同步</span>}
            </span>
          )}
          {meeting.isReadOnly && (
            <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-100">
                <Users size={10} />
            </span>
          )}
          {meeting.isStarred && (
            <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
        </div>
        
        {/* 如果有搜索结果片段，优先显示片段 */}
        {meeting.matchSnippet ? (
           <div className="flex items-start gap-1.5 mt-1 bg-yellow-50/80 px-2 py-1 rounded-md border border-yellow-100/50">
              <Search size={12} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 line-clamp-2 italic">
                 <span dangerouslySetInnerHTML={{ __html: meeting.matchSnippet.replace(/(\.\.\.)/g, '<span class="text-slate-300">$1</span>') }} />
              </div>
           </div>
        ) : (
           showFormatInfo && (
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="uppercase font-mono">{meeting.format}</span>
              <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
              <div className={`flex items-center gap-1 ${isUncategorized ? 'text-slate-300' : 'text-slate-500'}`} title={folderName}>
                    {folder ? <Folder size={10} /> : <Inbox size={10} />}
                    <span className="truncate max-w-[80px]">{folderName}</span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
