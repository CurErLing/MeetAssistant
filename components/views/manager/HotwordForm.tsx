
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../common/Button';

interface HotwordFormProps {
  categories: string[];
  onAdd: (word: string, category: string) => void;
}

export const HotwordForm: React.FC<HotwordFormProps> = ({ categories, onAdd }) => {
  const [newWord, setNewWord] = useState("");
  const [category, setCategory] = useState(categories[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWord.trim()) {
      onAdd(newWord.trim(), category);
      setNewWord("");
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Plus size={16} className="text-blue-600"/> 添加新热词
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="输入热词内容 (如：积木会议助手)" 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
           <select 
             className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
             value={category}
             onChange={(e) => setCategory(e.target.value)}
           >
             {categories.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
        <Button type="submit" disabled={!newWord.trim()}>
          添加
        </Button>
      </form>
    </div>
  );
};
