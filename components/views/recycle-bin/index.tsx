
import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { MeetingFile } from '../../../types';
import { ConfirmModal } from '../../modals/ConfirmModal';
import { RecycleBinTable } from './RecycleBinTable';
import { EmptyState } from '../../EmptyState';

export const RecycleBinView = ({ 
  deletedMeetings, 
  onRestore, 
  onPermanentDelete
}: { 
  deletedMeetings: MeetingFile[], 
  onRestore: (id: string) => void,
  onPermanentDelete: (id: string) => void
}) => {
  const [meetingToDeleteId, setMeetingToDeleteId] = useState<string | null>(null);
  
  const calculateDaysLeft = (deletedAt?: Date) => {
    if (!deletedAt) return 7;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deletedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - diffDays);
  };

  const handleConfirmDelete = () => {
    if (meetingToDeleteId) {
      onPermanentDelete(meetingToDeleteId);
      setMeetingToDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col pb-10">
      
      <ConfirmModal 
        isOpen={!!meetingToDeleteId}
        onClose={() => setMeetingToDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="彻底删除"
        description="您确定要彻底删除此会议记录吗？此操作无法撤销。"
        warningText="警告：文件将被永久移除，无法恢复。"
        confirmText="彻底删除"
        variant="danger"
      />

      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">回收站</h2>
          <p className="text-slate-500 mt-1 text-sm">管理已删除的会议记录。</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
           <AlertTriangle size={14} />
           <span>项目将在删除 7 天后被永久清除</span>
        </div>
      </div>

      {deletedMeetings.length === 0 ? (
        <EmptyState 
          icon={Trash2}
          title="回收站为空"
          description="这里没有任何垃圾文件。"
          className="flex-1 bg-white border border-slate-200"
        />
      ) : (
        <RecycleBinTable 
           deletedMeetings={deletedMeetings}
           onRestore={onRestore}
           onConfirmDelete={setMeetingToDeleteId}
           calculateDaysLeft={calculateDaysLeft}
        />
      )}
    </div>
  );
};
