
import React, { useState, useEffect } from 'react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
  offsetTop: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  activeId: string;
  onItemClick: (id: string) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  items, 
  activeId, 
  onItemClick 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) return null;

  // 限制收起状态下显示的线条数量，防止溢出
  const maxVisibleLines = 12;
  const visibleItems = items.length > maxVisibleLines ? items.slice(0, maxVisibleLines) : items;
  const hasMore = items.length > maxVisibleLines;

  return (
    <div 
      className="fixed right-6 top-[20%] z-30 flex flex-col items-end"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* 折叠状态下的指示条 */}
      <div className={`
        bg-white border border-slate-200 shadow-sm rounded-xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col
        ${isExpanded ? 'w-64 opacity-100 translate-x-0 shadow-xl' : 'w-12 h-32 opacity-80 hover:opacity-100'}
      `}>
        {!isExpanded ? (
          // 收起状态：根据标题数量动态显示横线
          <div className={`
            h-full w-full flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-white transition-colors
            ${items.length > 8 ? 'gap-1.5' : 'gap-2'}
          `}>
             {visibleItems.map((item) => (
               <div 
                 key={item.id} 
                 className={`
                   h-0.5 rounded-full transition-all duration-300
                   ${activeId === item.id ? 'bg-blue-600 w-6 shadow-[0_0_4px_rgba(37,99,235,0.4)]' : 'bg-slate-300 w-4'}
                 `}
               />
             ))}
             {hasMore && (
               <div className="w-1 h-1 bg-slate-300 rounded-full mt-0.5"></div>
             )}
          </div>
        ) : (
          // 展开状态：显示完整目录
          <div className="flex flex-col max-h-[60vh]">
            <div className="px-4 py-3 border-b border-slate-50 flex-shrink-0 bg-white">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">大纲导航 ({items.length})</span>
            </div>
            <div className="overflow-y-auto custom-scrollbar px-2 py-2 flex-1 bg-white">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  className={`
                    w-full text-left py-2 px-3 rounded-lg text-sm transition-colors mb-0.5 leading-snug truncate
                    ${activeId === item.id 
                      ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-500' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'}
                  `}
                  style={{ 
                    paddingLeft: `${(item.level - 1) * 12 + 12}px` 
                  }}
                  title={item.text}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
