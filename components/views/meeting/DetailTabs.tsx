
import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, LayoutTemplate, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { AnalysisResult, Template } from '../../../types';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface DetailTabsProps {
  activeTab: string;
  analyses: AnalysisResult[];
  templates: Template[];
  isSelectingTemplate: boolean;
  onTabChange: (tabId: string) => void;
  onToggleTemplateSelector: () => void;
  onRegenerateAnalysis: (id: string) => void;
  onChangeTemplate: (id: string) => void;
  onEditAnalysis: (id: string) => void;
  onDeleteAnalysis: (id: string) => void;
  readOnly?: boolean;
}

export const DetailTabs: React.FC<DetailTabsProps> = ({
  activeTab,
  analyses,
  templates,
  isSelectingTemplate,
  onTabChange,
  onToggleTemplateSelector,
  onRegenerateAnalysis,
  onChangeTemplate,
  onEditAnalysis,
  onDeleteAnalysis,
  readOnly = false
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0 });
  
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use hook to close menu
  useClickOutside(menuRef, () => setOpenMenuId(null), !!openMenuId);

  // 1. 关闭菜单：当发生滚动时
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    const handleScroll = () => {
        if (openMenuId) setOpenMenuId(null);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [openMenuId]);

  // 2. 点击标签处理
  const handleTabClick = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (activeTab === id && !isSelectingTemplate) {
      if (readOnly) return; // 只读模式下不允许打开菜单
      
      if (openMenuId === id) {
        setOpenMenuId(null);
      } else {
        // 计算菜单位置：相对于外层容器
        if (containerRef.current) {
             const containerRect = containerRef.current.getBoundingClientRect();
             const buttonRect = e.currentTarget.getBoundingClientRect();
             // 菜单左侧与按钮左侧对齐
             setMenuPosition({ left: buttonRect.left - containerRect.left });
        }
        setOpenMenuId(id);
      }
    } else {
      onTabChange(id);
      setOpenMenuId(null);
    }
  };

  const activeAnalysis = analyses?.find(a => a.id === openMenuId);
  const isProcessing = activeAnalysis?.status === 'processing';

  return (
    <div ref={containerRef} className="bg-white border-b border-slate-50 flex items-center justify-between flex-shrink-0 relative z-20 min-h-[50px]">
       
       {/* 可滚动的标签列表容器 */}
       <div ref={scrollContainerRef} className="px-6 sm:px-10 flex items-center gap-6 overflow-x-auto no-scrollbar flex-1 h-full relative z-0">
          {/* 固定 Tab: 转写 */}
          <button 
            onClick={() => { onTabChange('transcript'); setOpenMenuId(null); }}
            className={`text-sm font-bold transition-all px-1 py-3 relative whitespace-nowrap ${
              activeTab === 'transcript' && !isSelectingTemplate 
                ? 'text-slate-900' 
                : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            转写
            {activeTab === 'transcript' && !isSelectingTemplate && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full"></div>
            )}
          </button>

          {/* 动态 Tabs: AI 分析 */}
          {analyses?.map((analysis) => {
            const template = templates.find(t => t.id === analysis.templateId);
            const isActive = activeTab === analysis.id && !isSelectingTemplate;
            const isMenuOpen = openMenuId === analysis.id;
            const isProcessingTab = analysis.status === 'processing';

            return (
              <button 
                key={analysis.id}
                onClick={(e) => handleTabClick(analysis.id, e)}
                className={`text-sm font-bold transition-all px-1 py-3 relative whitespace-nowrap flex items-center gap-1 group flex-shrink-0 ${
                  isActive 
                    ? 'text-slate-900' 
                    : 'text-slate-300 hover:text-slate-500'
                }`}
              >
                {template?.name || "分析"}
                
                {/* 激活状态指示箭头 */}
                {isActive && !readOnly && (
                  <ChevronDown size={12} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                )}

                {/* 处理中动画 */}
                {isActive && isProcessingTab && !isMenuOpen && (
                    <RefreshCw size={10} className="animate-spin ml-1 text-slate-400" />
                )}

                {/* 底部下划线 */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full"></div>
                )}
              </button>
            );
          })}

          {/* 加号按钮 - 只在非只读模式下显示 */}
          {!readOnly && (
            <div className="relative flex items-center h-full z-0 flex-shrink-0 ml-2">
                <button 
                  onClick={onToggleTemplateSelector}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                    isSelectingTemplate 
                      ? 'bg-slate-900 text-white shadow-lg' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                  title="添加 AI 视角分析"
                >
                  <Plus size={16} className={isSelectingTemplate ? 'rotate-45 transition-transform' : 'transition-transform'} />
                </button>
            </div>
          )}
       </div>

       {/* 下拉菜单 - 移出滚动容器，绝对定位 */}
       {openMenuId && activeAnalysis && !readOnly && (
          <div 
            ref={menuRef} 
            className="absolute top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 animate-slide-up origin-top-left overflow-hidden z-30"
            style={{ left: menuPosition.left }}
          >
             <button 
               onClick={(e) => { e.stopPropagation(); onEditAnalysis(openMenuId); setOpenMenuId(null); }}
               className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
               disabled={isProcessing}
             >
                <Edit2 size={14} /> 编辑内容
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); onChangeTemplate(openMenuId); setOpenMenuId(null); }}
               className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
             >
                <LayoutTemplate size={14} /> 更换模版
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); onRegenerateAnalysis(openMenuId); setOpenMenuId(null); }}
               className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
               disabled={isProcessing}
             >
                <RefreshCw size={14} className={isProcessing ? "animate-spin" : ""} /> 重新生成
             </button>
             <div className="h-px bg-slate-50 mx-2 my-1"></div>
             <button 
               onClick={(e) => { e.stopPropagation(); onDeleteAnalysis(openMenuId); setOpenMenuId(null); }}
               className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
             >
                <Trash2 size={14} /> 删除
             </button>
          </div>
       )}
    </div>
  );
};
