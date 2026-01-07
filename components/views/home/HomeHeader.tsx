
import React from 'react';
import { MeetingActionToolbar } from '../../MeetingActionToolbar';
import { SearchBar } from '../../common/SearchBar';

interface HomeHeaderProps {
  onTriggerHardwareSync: () => void;
  onTriggerUpload: () => void;
  onStartRecording: () => void;
  isHardwareSyncing: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onTriggerHardwareSync,
  onTriggerUpload,
  onStartRecording,
  isHardwareSyncing,
  searchQuery,
  onSearchChange
}) => {
  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">你好, 邱</h2>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">欢迎回来，今天有什么需要处理的会议吗？</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
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
    </section>
  );
};
