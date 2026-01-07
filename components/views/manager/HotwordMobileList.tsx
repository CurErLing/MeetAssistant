
import React from 'react';
import { Edit2, Trash2, Tag } from 'lucide-react';
import { Hotword } from '../../../types';

interface HotwordMobileListProps {
  hotwords: Hotword[];
  onEdit: (hotword: Hotword) => void;
  onDelete: (id: string) => void;
}

export const HotwordMobileList: React.FC<HotwordMobileListProps> = ({ hotwords, onEdit, onDelete }) => {
  return (
    <div className="sm:hidden space-y-3 pb-10">
       {hotwords.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center">
             <Tag size={24} className="mx-auto mb-2 opacity-30 text-slate-500" />
             <p className="text-sm text-slate-400">暂无热词</p>
          </div>
       ) : hotwords.map((hw) => (
          <div key={hw.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
             <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-900 text-sm">{hw.word}</span>
                <div className="flex gap-1">
                   <button onClick={() => onEdit(hw)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded">
                      <Edit2 size={16} />
                   </button>
                   <button onClick={() => onDelete(hw.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                   </button>
                </div>
             </div>
             <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{hw.category}</span>
                <span className="font-mono opacity-70">{hw.createdAt.toLocaleDateString()}</span>
             </div>
          </div>
       ))}
    </div>
  );
};
