
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { VoiceprintProfile } from '../../../types';
import { Button } from '../../common/Button';
import { EditVoiceprintModal } from '../../modals/SettingsModals';
import { ConfirmModal } from '../../modals/ConfirmModal';
import { VoiceprintRecorder } from './VoiceprintRecorder';
import { VoiceprintCard } from './VoiceprintCard';

export const VoiceprintManagerView = ({ 
  voiceprints, 
  onAdd, 
  onUpdate,
  onDelete
}: { 
  voiceprints: VoiceprintProfile[], 
  onAdd: (name: string, file?: Blob) => void, 
  onUpdate: (id: string, name?: string, file?: Blob) => void,
  onDelete: (id: string) => void
}) => {
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [editingVp, setEditingVp] = useState<VoiceprintProfile | null>(null);
  const [deletingVpId, setDeletingVpId] = useState<string | null>(null);
  const [updatingAudioForId, setUpdatingAudioForId] = useState<string | null>(null);

  // Handle saving new voiceprint
  const handleCreateSave = (name: string, file: Blob | null) => {
    onAdd(name, file || undefined);
    setIsRecorderOpen(false);
  };

  // Handle saving re-recorded audio
  const handleUpdateAudioSave = (name: string, file: Blob | null) => {
     if (updatingAudioForId) {
         onUpdate(updatingAudioForId, name, file || undefined);
         setUpdatingAudioForId(null);
     }
     setIsRecorderOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingVpId) {
      onDelete(deletingVpId);
      setDeletingVpId(null);
    }
  };

  const startUpdateAudio = () => {
      if (editingVp) {
          setUpdatingAudioForId(editingVp.id);
          setEditingVp(null); // Close edit modal
          setIsRecorderOpen(true); // Open recorder
      }
  };

  const handleRecorderClose = () => {
      if (updatingAudioForId) {
          // If we were updating, go back to edit modal
          const originalVp = voiceprints.find(vp => vp.id === updatingAudioForId);
          if (originalVp) {
              setEditingVp(originalVp);
          }
          setUpdatingAudioForId(null);
      }
      setIsRecorderOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <ConfirmModal 
        isOpen={!!deletingVpId}
        onClose={() => setDeletingVpId(null)}
        onConfirm={handleConfirmDelete}
        title="确认删除"
        description="您确定要删除此声纹数据吗？"
        warningText="警告：删除后无法恢复，需要重新录入。"
        confirmText="删除"
        variant="danger"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">声纹管理</h2>
          <p className="text-slate-500 mt-1 text-sm">管理已注册的发言人声纹，提高识别准确率。</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setIsRecorderOpen(true)}>
           新增声纹
        </Button>
      </div>

      {editingVp && (
        <EditVoiceprintModal 
          voiceprintId={editingVp.id}
          initialName={editingVp.name}
          onSave={(name) => {
            onUpdate(editingVp.id, name);
            setEditingVp(null);
          }}
          onUpdateAudio={startUpdateAudio}
          onClose={() => setEditingVp(null)}
        />
      )}

      {isRecorderOpen && (
        <VoiceprintRecorder 
          initialName={updatingAudioForId ? voiceprints.find(v => v.id === updatingAudioForId)?.name : ""}
          onClose={handleRecorderClose} 
          onSave={updatingAudioForId ? handleUpdateAudioSave : handleCreateSave} 
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-10">
         {voiceprints.map(vp => (
           <VoiceprintCard 
             key={vp.id}
             voiceprint={vp}
             onClick={() => setEditingVp(vp)}
             onDelete={() => setDeletingVpId(vp.id)}
           />
         ))}
      </div>
    </div>
  );
};
