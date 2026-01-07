
import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { MeetingFile, Folder } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';
import { formatTime } from '../../../utils/formatUtils';
import { MeetingActionDropdown } from '../../common/MeetingActionDropdown';
import { MeetingMeta } from '../../common/MeetingMeta';
import { useMeetingModals } from '../../../hooks/useMeetingModals';

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

  const { handleMeetingAction, MeetingModals } = useMeetingModals(folders, {
    deleteMeeting: onDeleteMeeting,
    moveMeeting: onMoveMeeting,
    renameMeeting: onRenameMeeting,
    toggleStar: onToggleStar,
    duplicate: onDuplicate,
    retry: onRetry
  });

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

  const getMockOwner = (id: string) => {
      const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const owners = ['雷军', '张小龙', 'Tim Cook', '产品总监', 'CTO', '王兴'];
      return owners[hash % owners.length];
  };

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
               const ownerName = meeting.isReadOnly ? getMockOwner(meeting.id) : '我';
               
               return (
                 <tr 
                   key={meeting.id} 
                   className={`transition-colors group relative ${isProcessing ? 'cursor-not-allowed opacity-70 bg-slate-50/30' : 'hover:bg-slate-50 cursor-pointer'}`}
                   onClick={() => handleItemClick(meeting.id, isProcessing)}
                 >
                   <td className="px-6 py-4">
                      <MeetingMeta 
                        meeting={meeting} 
                        isProcessing={isProcessing} 
                        showFormatInfo={false} // Home list is compact
                      />
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
