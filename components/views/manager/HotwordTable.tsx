
import React from 'react';
import { Edit2, Trash2, Tag } from 'lucide-react';
import { Hotword } from '../../../types';

interface HotwordTableProps {
  hotwords: Hotword[];
  onEdit: (hotword: Hotword) => void;
  onDelete: (id: string) => void;
}

export const HotwordTable: React.FC<HotwordTableProps> = ({ hotwords, onEdit, onDelete }) => {
  return (
    <div className="hidden sm:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">热词内容</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">分类</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">添加时间</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hotwords.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Tag size={32} className="mb-2 opacity-50" />
                    <p>暂无热词，请在上方添加。</p>
                  </div>
                </td>
              </tr>
            ) : hotwords.map((hw) => (
              <tr key={hw.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4">
                  <span className="font-medium text-slate-900 text-sm">{hw.word}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {hw.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                  {hw.createdAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button"
                      onClick={() => onEdit(hw)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => onDelete(hw.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
