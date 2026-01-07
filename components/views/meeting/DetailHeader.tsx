
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit2, Check, Share2, Download, Lock } from 'lucide-react';
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
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({
  title,
  onBack,
  onUpdateTitle,
  onShare,
  onExport,
  isSelectingTemplate,
  onCancelSelectTemplate,
  readOnly = false
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
    <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 bg-white border-b border-slate-100">
       <div className="flex items-center space-x-3">
         <button 
           onClick={handleBack} 
           className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-800 lg:hidden"
         >
            <ChevronLeft size={24} />
         </button>
         <div className="min-w-0">
            {isEditingName && !readOnly ? (
              // 编辑标题模式
              <div className="flex items-center gap-2">
                <input 
                  className="text-lg font-bold text-slate-900 border-b-2 border-blue-500 focus:outline-none bg-transparent px-1 min-w-[200px]" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)} 
                  autoFocus 
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} 
                />
                <button onClick={handleSaveName} className="p-1 text-green-600 rounded"><Check size={20} /></button>
              </div>
            ) : (
              // 显示标题模式
              <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 truncate max-w-md">
                    {title}
                  </h2>
                  {!isSelectingTemplate && !readOnly ? (
                    <button 
                      onClick={() => setIsEditingName(true)} 
                      className="text-slate-200 hover:text-blue-500 p-1 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  ) : readOnly && (
                    <div className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                       <Lock size={10} /> 只读
                    </div>
                  )}
              </div>
            )}
         </div>
       </div>
       <div className="flex gap-2">
          {!readOnly && <Button variant="ghost" size="sm" icon={<Share2 size={18} />} onClick={onShare} className="hidden sm:inline-flex" />}
          <Button variant="primary" size="sm" icon={<Download size={18} />} onClick={onExport} />
       </div>
    </div>
  );
};
