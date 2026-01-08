
import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { MeetingFile } from '../../../types';
import { ConfirmModal } from '../../modals/ConfirmModal';
import { RecycleBinTable } from './RecycleBinTable';
import { EmptyState } from '../../EmptyState';
import { Button } from '../../common/Button';

export const RecycleBinView = ({ 
  deletedMeetings, 
  onRestore, 
  onPermanentDelete,
  onEmptyRecycleBin
}: { 
  deletedMeetings: MeetingFile[], 
  onRestore: (id: string) => void,
  onPermanentDelete: (id: string) => void,
  onEmptyRecycleBin: () => void
}) => {
  const [meetingToDeleteId, setMeetingToDeleteId] = useState<string | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  
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

  const handleConfirmEmpty = () => {
    onEmptyRecycleBin();
    setShowEmptyConfirm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col pb-10">
      
      {/* 单个删除确认 */}
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

      {/* 清空回收站确认 */}
      <ConfirmModal 
        isOpen={showEmptyConfirm}
        onClose={() => setShowEmptyConfirm(false)}
        onConfirm={handleConfirmEmpty}
        title="清空回收站"
        description={`您确定要永久删除回收站中的所有 (${deletedMeetings.length}) 个项目吗？`}
        warningText="警告：清空后所有文件将无法恢复。"
        confirmText="确认清空"
        variant="danger"
      />

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">回收站</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
             <p className="text-slate-500 text-sm">管理已删除的会议记录。</p>
             <div className="inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 w-fit">
                <AlertTriangle size={12} />
                <span>项目将在删除 7 天后被永久清除</span>
             </div>
          </div>
        </div>
        <div>
           <Button 
             variant="danger" 
             icon={<Trash2 size={16} />} 
             onClick={() => setShowEmptyConfirm(true)}
             disabled={deletedMeetings.length === 0}
             className="shadow-sm"
           >
             清空回收站
           </Button>
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
