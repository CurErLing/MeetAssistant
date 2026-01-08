
import React, { useState } from 'react';
import { PlusCircle, Heart, Link as LinkIcon } from 'lucide-react';
import { Template } from '../../../types';
import { CreateTemplateModal, TemplateDetailModal } from '../../modals/TemplateModals';
import { SyncTemplatesModal } from '../../modals/SyncTemplatesModal';
import { TemplateCard } from './TemplateCard';
import { FilterBar } from './FilterBar';

export const TemplateManagerView = ({ 
  templates,
  toggleStarTemplate,
  onAdd,
  onUpdate,
  onDelete,
  initialSelectedId
}: { 
  templates: Template[],
  toggleStarTemplate: (id: string) => void,
  onAdd: (template: Template) => void,
  onUpdate: (id: string, updates: Partial<Template>) => void,
  onDelete: (id: string) => void,
  initialSelectedId?: string | null
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'mine' | 'explore'>('explore');
  const [activeFilter, setActiveFilter] = useState('全部');
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialSelectedId || null);

  const starredTemplates = templates.filter(t => t.isStarred);
  const myOwnTemplates = templates.filter(t => t.isUserCreated);
  const exploreTemplates = activeFilter === '全部' 
    ? templates 
    : templates.filter(t => t.category === activeFilter);

  const activeTemplate = templates.find(t => t.id === selectedTemplateId);
  const categories = ['全部', '通用', '会议', '演讲', '面试']; // Simplified for modal usage

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
       
       {isCreatingModalOpen && (
         <CreateTemplateModal 
           categories={categories.slice(1)} // Remove '全部'
           onSave={(tpl) => {
             onAdd(tpl);
             setIsCreatingModalOpen(false);
           }}
           onClose={() => setIsCreatingModalOpen(false)}
         />
       )}

       {isSyncModalOpen && (
         <SyncTemplatesModal 
           onImport={(importedTemplates) => {
             // Batch add templates
             importedTemplates.forEach(t => onAdd(t));
           }}
           onClose={() => setIsSyncModalOpen(false)}
         />
       )}

       {activeTemplate && (
         <TemplateDetailModal 
           template={activeTemplate}
           categories={categories.slice(1)}
           onSave={onUpdate}
           onDelete={onDelete}
           onClose={() => setSelectedTemplateId(null)}
         />
       )}

       <div className="flex items-center justify-start mb-8 sticky top-0 z-30 pt-4">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner border border-slate-200">
             <button 
               onClick={() => setActiveMainTab('mine')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeMainTab === 'mine' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               我的模板
             </button>
             <button 
               onClick={() => setActiveMainTab('explore')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeMainTab === 'explore' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               探索
             </button>
          </div>
       </div>

       {activeMainTab === 'mine' ? (
         <div className="space-y-10 pb-10">
            <section>
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   我的作品 <span className="text-xs font-normal text-slate-400">({myOwnTemplates.length})</span>
                 </h3>
                 <button 
                   onClick={() => setIsSyncModalOpen(true)}
                   className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                 >
                    <LinkIcon size={14} /> 从飞书同步
                 </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 <button 
                   onClick={() => setIsCreatingModalOpen(true)}
                   className="h-52 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                 >
                    <PlusCircle size={32} className="mb-2 opacity-50 group-hover:opacity-100" />
                    <span className="font-bold text-sm">创建新模板</span>
                 </button>
                 {myOwnTemplates.map(t => (
                   <TemplateCard 
                     key={t.id} 
                     template={t} 
                     onClick={() => setSelectedTemplateId(t.id)}
                     onToggleStar={toggleStarTemplate} 
                   />
                 ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   收藏模板 <span className="text-xs font-normal text-slate-400">({starredTemplates.length})</span>
                 </h3>
              </div>
              {starredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {starredTemplates.map(t => (
                     <TemplateCard 
                       key={t.id} 
                       template={t} 
                       onClick={() => setSelectedTemplateId(t.id)}
                       onToggleStar={toggleStarTemplate} 
                     />
                   ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
                   <Heart size={32} className="mx-auto mb-2 opacity-20" />
                   <p className="text-sm">尚未收藏任何模板，去“探索”看看吧</p>
                </div>
              )}
            </section>
         </div>
       ) : (
         <div className="flex flex-col h-full">
            <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-bold text-slate-800">{activeFilter === '全部' ? '通用模板' : `${activeFilter}模板`}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                 {exploreTemplates.map(t => (
                   <TemplateCard 
                     key={t.id} 
                     template={t} 
                     onClick={() => setSelectedTemplateId(t.id)}
                     onToggleStar={toggleStarTemplate} 
                   />
                 ))}
              </div>
            </div>
         </div>
       )}
    </div>
  );
};
