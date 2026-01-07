
import React, { useState } from 'react';
import { Hotword } from '../../../types';
import { EditHotwordModal } from '../../modals/SettingsModals';
import { ConfirmModal } from '../../modals/ConfirmModal';
import { HotwordForm } from './HotwordForm';
import { HotwordTable } from './HotwordTable';
import { HotwordMobileList } from './HotwordMobileList';

export const HotwordManagerView = ({
  hotwords,
  onAdd,
  onUpdate,
  onDelete
}: {
  hotwords: Hotword[],
  onAdd: (word: string, category: string) => void,
  onUpdate: (id: string, word: string, category: string) => void,
  onDelete: (id: string) => void
}) => {
  const [editingHotword, setEditingHotword] = useState<Hotword | null>(null);
  const [deletingHotwordId, setDeletingHotwordId] = useState<string | null>(null);
  
  const categories = ["公司/组织", "人名", "产品/项目", "行业术语", "其他"];

  const handleConfirmDelete = () => {
    if (deletingHotwordId) {
      onDelete(deletingHotwordId);
      setDeletingHotwordId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <ConfirmModal 
        isOpen={!!deletingHotwordId}
        onClose={() => setDeletingHotwordId(null)}
        onConfirm={handleConfirmDelete}
        title="确认删除"
        description="您确定要删除此热词吗？"
        warningText="警告：删除后无法恢复。"
        confirmText="删除"
        variant="danger"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">热词管理</h2>
          <p className="text-slate-500 mt-1 text-sm">定义专属词汇，提升语音转写的识别准确率。</p>
        </div>
      </div>

      {editingHotword && (
        <EditHotwordModal 
          hotword={editingHotword}
          categories={categories}
          onSave={(word, cat) => {
            onUpdate(editingHotword.id, word, cat);
            setEditingHotword(null);
          }}
          onClose={() => setEditingHotword(null)}
        />
      )}

      {/* 1. Add New Form */}
      <HotwordForm 
        categories={categories}
        onAdd={onAdd}
      />

      {/* 2. Desktop Table View */}
      <HotwordTable 
        hotwords={hotwords}
        onEdit={setEditingHotword}
        onDelete={setDeletingHotwordId}
      />

      {/* 3. Mobile Card View */}
      <HotwordMobileList 
        hotwords={hotwords}
        onEdit={setEditingHotword}
        onDelete={setDeletingHotwordId}
      />
    </div>
  );
};
