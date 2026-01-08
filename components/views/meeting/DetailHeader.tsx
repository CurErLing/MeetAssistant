
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit2, Check, Share2, Download, Lock, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../../common/Button';

interface DetailHeaderProps {
  title: string;
  onBack: () => void;
  onUpdateTitle: (newTitle: string) => void;
  onShare: () => void;
  onExport: () => void;
  isSelectingTemplate: boolean;
  onCancelSelectTemplate: () => void;
  readOnly?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({
  title,
  onBack,
  onUpdateTitle,
  onShare,
  onExport,
  isSelectingTemplate,
  onCancelSelectTemplate,
  readOnly = false,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(title);

  // Sync tempName when external title changes
  useEffect(() => {
    setTempName(title);
  }, [title]);

  const handleSaveName = () => {
    if (tempName.trim() && tempName !== title) {
      onUpdateTitle(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleBack = () => {
    if (isSelectingTemplate) {
      onCancelSelectTemplate();
    } else {
      onBack();
    }
  };

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0 bg-white border-b border-slate-100">
       <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
         <button 
           onClick={handleBack} 
           className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-800 lg:hidden flex-shrink-0"
         >
            <ChevronLeft size={24} />
         </button>
         <div className="min-w-0 flex-1">
            {isEditingName && !readOnly ? (
              // 编辑标题模式
              <div className="flex items-center gap-2">
                <input 
                  className="text-lg font-bold text-slate-900 border-b-2 border-blue-500 focus:outline-none bg-transparent px-1 w-full" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)} 
                  autoFocus 
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} 
                />
                <button onClick={handleSaveName} className="p-1 text-green-600 rounded flex-shrink-0"><Check size={20} /></button>
              </div>
            ) : (
              // 显示标题模式
              <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {title}
                  </h2>
                  {!isSelectingTemplate && !readOnly ? (
                    <button 
                      onClick={() => setIsEditingName(true)} 
                      className="text-slate-200 hover:text-blue-500 p-1 transition-colors flex-shrink-0"
                    >
                      <Edit2 size={14} />
                    </button>
                  ) : readOnly && (
                    <div className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 flex-shrink-0">
                       <Lock size={10} /> 只读
                    </div>
                  )}
              </div>
            )}
         </div>
       </div>
       
       <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Mobile Navigation (Hidden on Large Screens where SideMenu exists) */}
          <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100 lg:hidden">
             <button 
               onClick={onPrevious}
               disabled={!hasPrevious}
               className="p-1.5 text-slate-500 disabled:text-slate-300 hover:text-blue-600 hover:bg-white disabled:hover:bg-transparent rounded-md transition-all disabled:cursor-not-allowed"
               title="上一条"
             >
               <ChevronUp size={18} />
             </button>
             <div className="w-px h-3 bg-slate-200 mx-0.5"></div>
             <button 
               onClick={onNext}
               disabled={!hasNext}
               className="p-1.5 text-slate-500 disabled:text-slate-300 hover:text-blue-600 hover:bg-white disabled:hover:bg-transparent rounded-md transition-all disabled:cursor-not-allowed"
               title="下一条"
             >
               <ChevronDown size={18} />
             </button>
          </div>

          {!readOnly && <Button variant="ghost" size="sm" icon={<Share2 size={18} />} onClick={onShare} className="hidden sm:inline-flex" />}
          <Button variant="primary" size="sm" icon={<Download size={18} />} onClick={onExport} className="hidden sm:inline-flex" />
       </div>
    </div>
  );
};
