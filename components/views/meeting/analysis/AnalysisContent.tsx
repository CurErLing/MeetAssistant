
import React, { useState, useRef, useMemo } from 'react';
import { parse } from 'marked';
import { TableOfContents, TocItem } from '../TableOfContents';

interface AnalysisContentProps {
  content: string;
  analysisId: string;
  header: React.ReactNode;
}

export const AnalysisContent: React.FC<AnalysisContentProps> = ({ 
  content, 
  analysisId,
  header
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>('');

  // 1. Markdown 解析与 TOC 生成
  const { html, items: tocItems } = useMemo(() => {
    if (!content) return { html: '', items: [] };

    try {
      const rawHtml = parse(content) as string;
      
      // 创建临时 DOM 解析 HTML 以提取标题
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawHtml;
      
      const headings = tempDiv.querySelectorAll('h1, h2, h3');
      const items: TocItem[] = [];
      const idPrefix = `analysis-${analysisId}`;

      headings.forEach((heading, index) => {
        // 生成稳定的唯一 ID
        const uniqueId = `${idPrefix}-heading-${index}`;
        heading.id = uniqueId;
        
        // 设置 scroll-margin-top 确保跳转时不贴顶
        (heading as HTMLElement).style.scrollMarginTop = '100px';
        
        items.push({
          id: uniqueId,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.substring(1)),
          offsetTop: 0 // 占位，实际跳转使用 scrollIntoView
        });
      });

      return { html: tempDiv.innerHTML, items };
    } catch (e) {
      console.error("Markdown parsing failed", e);
      return { html: content, items: [] };
    }
  }, [content, analysisId]);

  // 2. 滚动监听 (Scroll Spy)
  const handleScroll = () => {
    if (!containerRef.current || tocItems.length === 0) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const triggerLine = containerRect.top + 120; // 触发线

    let currentId = tocItems[0].id;
    
    for (const item of tocItems) {
        const element = document.getElementById(item.id);
        if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top < triggerLine) {
                currentId = item.id;
            } else {
                break;
            }
        }
    }
    
    if (currentId !== activeId) {
      setActiveId(currentId);
    }
  };

  // 3. 目录点击跳转
  const handleTocClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // 移除容器内旧的高亮
      containerRef.current?.querySelectorAll('.animate-highlight').forEach(el => {
         el.classList.remove('animate-highlight', 'bg-blue-50', 'text-blue-700', 'px-2', '-ml-2');
      });

      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);

      // 添加高亮动画
      element.classList.add('animate-highlight', 'bg-blue-50', 'text-blue-700', 'rounded-lg', 'transition-all', 'duration-1000', 'px-2', '-ml-2');
      setTimeout(() => {
        if(element) element.classList.remove('bg-blue-50', 'text-blue-700', 'px-2', '-ml-2');
      }, 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* 悬浮目录 */}
      {tocItems.length > 0 && (
        <TableOfContents 
          items={tocItems} 
          activeId={activeId} 
          onItemClick={handleTocClick} 
        />
      )}

      {/* 滚动容器 */}
      <div 
        className="flex-1 overflow-y-auto p-6 sm:p-10 relative scroll-smooth" 
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div className="max-w-5xl mx-auto pb-20 transition-all">
            {/* 注入头部组件，使其随内容滚动 */}
            {header}
            <div className="markdown-body text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
};
