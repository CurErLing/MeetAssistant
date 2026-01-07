
import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Sparkles, LayoutTemplate 
} from 'lucide-react';
import { Template } from '../../../types';
import { SearchBar } from '../../common/SearchBar';

export const TemplatePickerView = ({ 
  templates, 
  onSelect, 
  onClose 
}: { 
  templates: Template[], 
  onSelect: (id: string) => void, 
  onClose: () => void 
}) => {
  const [filter, setFilter] = useState('全部');
  const [search, setSearch] = useState('');

  const categories = ['全部', ...new Set(templates.map(t => t.category))];
  
  const filteredTemplates = templates.filter(t => {
    const matchesFilter = filter === '全部' || t.category === filter;
    const matchesSearch = t.name.includes(search) || t.description.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-white animate-slide-up origin-bottom">
      {/* View Header */}
      <div className="px-6 sm:px-10 py-6 border-b border-slate-50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-800">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="text-xl font-bold text-slate-900">选择 AI 视角分析模板</h3>
            <p className="text-xs text-slate-400 mt-0.5">选择一个模板，AI 将基于您的会议记录生成深度分析</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-6 sm:px-10 py-4 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center flex-shrink-0 bg-slate-50/30">
        <div className="flex items-center gap-2 overflow-x-auto pb-3 w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                filter === cat 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
           <SearchBar 
             placeholder="搜索模板..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredTemplates.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="flex flex-col text-left p-6 bg-white border border-slate-100 rounded-2xl hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden active:scale-[0.98]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                    <Plus size={16} />
                 </div>
              </div>
              
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                 <Sparkles size={24} />
              </div>
              
              <h4 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{t.name}</h4>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{t.description}</p>
              
              <div className="mt-auto flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.category}</span>
                 {t.isUserCreated && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md font-bold uppercase">自定义</span>}
              </div>
            </button>
          ))}
          
          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-20 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                  <LayoutTemplate size={32} />
               </div>
               <p className="text-slate-400 font-medium">没有找到匹配的模板</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
