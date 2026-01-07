
import React from 'react';
import { FileText, Heart } from 'lucide-react';
import { Template } from '../../../types';
import { ICON_MAP } from '../../../constants/templateIcons';

interface TemplateCardProps {
  template: Template;
  onClick: () => void;
  onToggleStar?: (id: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = React.memo(({ template, onClick, onToggleStar }) => {
  const IconComponent = ICON_MAP[template.icon as string] || FileText;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col h-52 relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
          <IconComponent size={20} />
        </div>
        {onToggleStar && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleStar(template.id); }}
            className={`p-1.5 rounded-full transition-colors ${template.isStarred ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-rose-400 hover:bg-slate-50'}`}
          >
            <Heart size={18} fill={template.isStarred ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      
      <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
        {template.name}
      </h3>
      
      <p className="text-xs text-slate-500 mb-4 line-clamp-3 flex-1 leading-relaxed">
        {template.description}
      </p>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex gap-1.5 overflow-hidden">
           {template.tags.slice(0, 1).map(tag => (
             <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 truncate max-w-[80px]">
               {tag}
             </span>
           ))}
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
           {template.author || `使用 ${template.usageCount || 0}`}
        </div>
      </div>
    </div>
  );
});
