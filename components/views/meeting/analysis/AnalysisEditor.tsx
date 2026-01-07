
import React, { useState } from 'react';
import { Save, X, FilePenLine } from 'lucide-react';
import { Button } from '../../../common/Button';

interface AnalysisEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export const AnalysisEditor: React.FC<AnalysisEditorProps> = ({ 
  initialContent, 
  onSave, 
  onCancel 
}) => {
  const [text, setText] = useState(initialContent);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 animate-fade-in relative">
       {/* 1. Editor Toolbar */}
       <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0 z-10 shadow-sm/50">
          <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <FilePenLine size={18} />
             </div>
             <div>
                <h3 className="text-sm font-bold text-slate-800">编辑模式</h3>
                <p className="text-[10px] text-slate-400">支持 Markdown 语法</p>
             </div>
          </div>
          <div className="flex gap-3">
             <Button variant="secondary" size="sm" onClick={onCancel} icon={<X size={16}/>}>取消</Button>
             <Button size="sm" onClick={() => onSave(text)} icon={<Save size={16}/>}>完成</Button>
          </div>
       </div>

       {/* 2. Main Editing Area */}
       <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
             <div className="max-w-5xl mx-auto min-h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                 <textarea 
                   className="flex-1 w-full p-8 sm:p-12 resize-none outline-none text-base leading-8 text-slate-800 font-mono placeholder:text-slate-300 selection:bg-blue-100 selection:text-blue-700" 
                   value={text} 
                   onChange={(e) => setText(e.target.value)}
                   placeholder="# 标题\n\n在此输入内容..."
                   autoFocus
                   spellCheck={false}
                 />
                 {/* Status Bar */}
                 <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono text-slate-400 select-none flex-shrink-0">
                    <span>MARKDOWN EDITOR</span>
                    <span>{text.length} CHARS</span>
                 </div>
             </div>
          </div>
       </div>
    </div>
  );
};
