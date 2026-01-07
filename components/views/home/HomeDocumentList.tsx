
import React, { useState } from 'react';
import { Cpu, Users, Calendar, Clock, Star } from 'lucide-react';
import { MeetingFile, Folder } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';
import { formatTime } from '../../../utils/formatUtils';
import { MeetingActionDropdown } from '../../common/MeetingActionDropdown';
import { MeetingIcon } from '../../common/MeetingIcon';
import { useMeetingModals } from '../../../hooks/useMeetingModals';
import { getOwnerName } from '../../../utils/meetingUtils';

interface HomeDocumentListProps {
  meetings: MeetingFile[];
  folders: Folder[];
  onSelectMeeting: (id: string) => void;
  onDeleteMeeting: (id: string) => void;
  onMoveMeeting: (meetingId: string, folderId: string | null) => void;
  onRenameMeeting: (id: string, newName: string) => void;
  onToggleStar: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRetry: (id: string) => void;
}

export const HomeDocumentList: React.FC<HomeDocumentListProps> = ({
  meetings,
  folders,
  onSelectMeeting,
  onDeleteMeeting,
  onMoveMeeting,
  onRenameMeeting,
  onToggleStar,
  onDuplicate,
  onRetry
}) => {
  const [activeTab, setActiveTab] = useState<'recent' | 'shared' | 'starred'>('recent');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Use the hook to manage modals locally for this list
  const { handleMeetingAction, MeetingModals } = useMeetingModals(folders, {
    deleteMeeting: onDeleteMeeting,
    moveMeeting: onMoveMeeting,
    renameMeeting: onRenameMeeting,
    toggleStar: onToggleStar,
    duplicate: onDuplicate,
    retry: onRetry
  });

  // Filter logic
  let displayList: MeetingFile[] = [];

  if (activeTab === 'recent') {
    displayList = [...meetings]
        .sort((a, b) => {
           const timeA = a.lastAccessedAt ? a.lastAccessedAt.getTime() : a.uploadDate.getTime();
           const timeB = b.lastAccessedAt ? b.lastAccessedAt.getTime() : b.uploadDate.getTime();
           return timeB - timeA;
        })
        .slice(0, 8);
  } else if (activeTab === 'shared') {
    displayList = [...meetings]
        .filter(m => m.isReadOnly)
        .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
  } else if (activeTab === 'starred') {
    displayList = [...meetings]
        .filter(m => m.isStarred)
        .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
  }

  const handleItemClick = (id: string, isProcessing: boolean) => {
    if (!isProcessing) onSelectMeeting(id);
  };

  return (
    <section>
      <MeetingModals />

      <div className="flex items-center gap-8 mb-4 border-b border-slate-100 overflow-x-auto no-scrollbar">
         <button 
           onClick={() => setActiveTab('recent')}
           className={`pb-3 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${activeTab === 'recent' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
         >
           最近访问
           {activeTab === 'recent' && (
             <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
           )}
         </button>
         <button 
           onClick={() => setActiveTab('shared')}
           className={`pb-3 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${activeTab === 'shared' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
         >
           与我共享
           {activeTab === 'shared' && (
             <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
           )}
         </button>
         <button 
           onClick={() => setActiveTab('starred')}
           className={`pb-3 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${activeTab === 'starred' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
         >
           收藏
           {activeTab === 'starred' && (
             <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
           )}
         </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
         <table className="w-full text-left">
           <thead className="bg-slate-50 border-b border-slate-200">
             <tr>
               <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider rounded-tl-xl">会议名称</th>
               <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">所有者</th>
               <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">日期</th>
               <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">时长</th>
               <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
               <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right rounded-tr-xl">操作</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {displayList.length > 0 ? displayList.map((meeting) => {
               const isProcessing = meeting.status === 'processing';
               const isHardware = meeting.name.toLowerCase().startsWith('hardware') || meeting.id.includes('hardware');
               const ownerName = getOwnerName(meeting);
               
               return (
                 <tr 
                   key={meeting.id} 
                   className={`transition-colors group relative ${isProcessing ? 'cursor-not-allowed opacity-70 bg-slate-50/30' : 'hover:bg-slate-50 cursor-pointer'}`}
                   onClick={() => handleItemClick(meeting.id, isProcessing)}
                 >
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <MeetingIcon format={meeting.format} status={meeting.status} size={18} className="w-9 h-9 rounded-lg" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                             <div className={`font-medium text-sm truncate max-w-[150px] sm:max-w-xs transition-colors ${isProcessing ? 'text-slate-400' : 'text-slate-900 group-hover:text-blue-600'}`}>{meeting.name}</div>
                             {isHardware && (
                               <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                 <Cpu size={10} />
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
                        </div>
                      </div>
                   </td>
                   <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-slate-600">{ownerName}</span>
                   </td>
                   <td className="px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">
                      <div className="flex items-center space-x-2">
                         <Calendar size={14} className="text-slate-400" />
                         <span>{meeting.uploadDate.toLocaleDateString()}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">
                      <div className="flex items-center space-x-2">
                         <Clock size={14} className="text-slate-400" />
                         <span className="font-mono">{meeting.duration > 0 ? formatTime(meeting.duration) : '--:--'}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <StatusBadge status={meeting.status} />
                   </td>
                   <td className="px-6 py-4 text-right relative">
                      <MeetingActionDropdown 
                        meeting={meeting}
                        activeMenuId={activeMenuId}
                        onToggle={setActiveMenuId}
                        onAction={handleMeetingAction}
                      />
                   </td>
                 </tr>
               );
             }) : (
               <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                   {activeTab === 'recent' && '暂无最近访问记录'}
                   {activeTab === 'shared' && '暂无共享文档'}
                   {activeTab === 'starred' && '暂无收藏文档'}
                 </td>
               </tr>
             )}
           </tbody>
         </table>
      </div>
    </section>
  );
};
