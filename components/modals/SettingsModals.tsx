
import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { BaseModal } from './BaseModal';
import { Hotword } from '../../types';
import { RefreshCw, PlayCircle } from 'lucide-react';
import { getAudioBlob } from '../../services/storage';

// --- Edit Hotword Modal ---

export const EditHotwordModal = ({
  hotword,
  categories,
  onSave,
  onClose
}: {
  hotword: Hotword,
  categories: string[],
  onSave: (word: string, category: string) => void,
  onClose: () => void
}) => {
  const [word, setWord] = useState(hotword.word);
  const [category, setCategory] = useState(hotword.category);

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-sm"
      title="编辑热词"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" className="flex-1">取消</Button>
          <Button onClick={() => onSave(word, category)} className="flex-1">保存</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">热词内容</label>
          <input 
            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
            value={word}
            onChange={(e) => setWord(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">分类</label>
          <select 
            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </BaseModal>
  );
};

// --- Edit Voiceprint Modal ---

export const EditVoiceprintModal = ({
  voiceprintId,
  initialName,
  onSave,
  onUpdateAudio,
  onClose
}: {
  voiceprintId: string,
  initialName: string,
  onSave: (name: string) => void,
  onUpdateAudio: () => void,
  onClose: () => void
}) => {
  const [name, setName] = useState(initialName);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadAudio = async () => {
      try {
        const blob = await getAudioBlob(voiceprintId);
        if (active && blob) {
          setAudioUrl(URL.createObjectURL(blob));
        }
      } catch (e) {
        console.error("Failed to load voiceprint audio", e);
      }
    };
    loadAudio();
    return () => { active = false; };
  }, [voiceprintId]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-sm"
      title="修改声纹信息"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" className="flex-1">取消</Button>
          <Button onClick={() => onSave(name)} className="flex-1">保存</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">姓名</label>
          <input 
            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        
        <div>
           <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">声纹数据</label>
           
           {audioUrl && (
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
               <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider flex items-center gap-1.5">
                  <PlayCircle size={12} className="text-blue-500"/> 当前音频样本
               </div>
               <audio controls src={audioUrl} className="w-full h-8 focus:outline-none" />
             </div>
           )}

           <Button 
             variant="secondary" 
             className="w-full justify-center text-slate-600" 
             icon={<RefreshCw size={14} />}
             onClick={onUpdateAudio}
           >
             重新录入/上传音频
           </Button>
           <p className="text-[10px] text-slate-400 mt-2">
             如果识别准确率较低，可以尝试重新录入该发言人的声纹样本。
           </p>
        </div>
      </div>
    </BaseModal>
  );
};
