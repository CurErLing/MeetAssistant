
import React, { useState, useEffect } from 'react';
import { 
  Users, Fingerprint, Mic, Sparkles, Edit2, Search, ChevronRight 
} from 'lucide-react';
import { Button } from '../common/Button';
import { BaseModal } from './BaseModal';
import { Speaker, SpeakerStatus, VoiceprintProfile } from '../../types';

// --- Edit Speaker Modal ---

export const EditSpeakerModal = ({
  speaker,
  onSave,
  onOpenVoiceprintPicker,
  onOpenVoiceprintRecorder,
  onClose
}: {
  speaker: Speaker,
  onSave: (newName: string) => void,
  onOpenVoiceprintPicker: () => void,
  onOpenVoiceprintRecorder: (currentName: string) => void,
  onClose: () => void
}) => {
  const [name, setName] = useState(speaker.name);

  useEffect(() => {
    setName(speaker.name);
  }, [speaker.name]);

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-sm"
      title={
        <>
          <Users size={20} className="text-blue-600" />
          <span>编辑发言人</span>
        </>
      }
      footer={
        <>
          <Button onClick={onClose} variant="secondary" className="flex-1">取消</Button>
          <Button onClick={() => onSave(name)} className="flex-1">保存</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">姓名</label>
          <input 
            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button 
            variant="secondary" 
            className="flex-col gap-1 py-3 text-indigo-600 border-indigo-100 bg-indigo-50/50" 
            icon={<Fingerprint size={18} />}
            onClick={onOpenVoiceprintPicker}
          >
            <span className="text-[10px] font-bold uppercase tracking-tighter">关联声纹</span>
          </Button>
          <Button 
            variant="secondary" 
            className="flex-col gap-1 py-3 text-blue-600 border-blue-100 bg-blue-50/50" 
            icon={<Mic size={18} />}
            onClick={() => onOpenVoiceprintRecorder(name)}
          >
            <span className="text-[10px] font-bold uppercase tracking-tighter">注册新声纹</span>
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

// --- Voiceprint Picker Modal ---

export const VoiceprintPickerModal = ({
  voiceprints,
  onSelect,
  onClose
}: {
  voiceprints: VoiceprintProfile[],
  onSelect: (vp: VoiceprintProfile) => void,
  onClose: () => void
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = voiceprints.filter(vp => 
    vp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title={
        <>
          <Fingerprint size={20} className="text-indigo-600" />
          <span>选择关联声纹</span>
        </>
      }
      footer={
        <Button variant="secondary" className="w-full" onClick={onClose}>取消</Button>
      }
    >
      <div className="mb-4">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="搜索已注册的声纹..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="max-h-[50vh] overflow-y-auto space-y-1 -mx-2 px-2">
        {filtered.map(vp => (
          <button 
            key={vp.id}
            onClick={() => onSelect(vp)}
            className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl transition-all group border border-transparent hover:border-blue-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                {vp.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900 group-hover:text-blue-600">{vp.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">注册于 {vp.createdAt.toLocaleDateString()}</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="py-10 text-center">
             <Fingerprint size={48} className="mx-auto text-slate-100 mb-4" />
             <p className="text-sm text-slate-400 font-medium">未找到匹配的声纹</p>
             <p className="text-xs text-slate-300 mt-1">请先在声纹管理中录入新声纹</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

// --- Voiceprint Recorder Modal ---

export const VoiceprintRecorderModal = ({
  initialName = "",
  onSave,
  onClose
}: {
  initialName?: string,
  onSave: (name: string) => void,
  onClose: () => void
}) => {
  const [name, setName] = useState(initialName);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleConfirm = () => {
    if (!name.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSave(name);
    }, 1500);
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-sm"
      title={
        <>
          <Fingerprint size={20} className="text-blue-600" />
          <span>注册新声纹</span>
        </>
      }
      footer={
        <>
           <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isProcessing}>取消</Button>
           <Button onClick={handleConfirm} className="flex-1" disabled={!name.trim() || isProcessing} isLoading={isProcessing}>
             {isProcessing ? '正在提取...' : '确认绑定'}
           </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">姓名</label>
          <input 
            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium text-slate-900"
            placeholder="输入发言人姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isProcessing}
            autoFocus
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
           <div className="mt-1 bg-blue-100 text-blue-600 p-1.5 rounded-lg flex-shrink-0">
              <Sparkles size={16} />
           </div>
           <div>
              <h4 className="text-sm font-bold text-blue-800 mb-1">自动提取声纹</h4>
              <p className="text-xs text-blue-600/80 leading-relaxed">
                系统将直接使用该发言人在当前会议中的音频片段建立声纹模型，并与姓名绑定。无需进行朗读录入。
              </p>
           </div>
        </div>
      </div>
    </BaseModal>
  );
};

// --- Speaker List Modal ---

export const SpeakerListModal = ({
  speakers,
  onEditSpeaker,
  onClose
}: {
  speakers: Record<string, Speaker>,
  onEditSpeaker: (id: string) => void,
  onClose: () => void
}) => {
  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title="发言人管理"
      footer={
        <Button onClick={onClose} variant="secondary" className="w-full">关闭</Button>
      }
    >
      <div className="max-h-96 overflow-y-auto p-1">
        {Object.values(speakers).map(speaker => (
          <div key={speaker.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${speaker.color}`}>
                {speaker.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-900">{speaker.name}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  {speaker.id}
                  {speaker.status === SpeakerStatus.REGISTERED && (
                    <span className="flex items-center gap-0.5 px-1 rounded bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase">
                      <Fingerprint size={8} /> 已关联声纹
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => onEditSpeaker(speaker.id)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Edit2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </BaseModal>
  );
};
