
import React, { useState } from 'react';
import { Link, Download, Check, FileText, Loader2, AlertCircle, ClipboardPaste } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { Button } from '../common/Button';
import { Template } from '../../types';
import { parseExternalTemplates } from '../../services/geminiService';

interface SyncTemplatesModalProps {
  onImport: (templates: Template[]) => void;
  onClose: () => void;
}

export const SyncTemplatesModal: React.FC<SyncTemplatesModalProps> = ({
  onImport,
  onClose
}) => {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundTemplates, setFoundTemplates] = useState<Template[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    
    try {
      // Use real Gemini service to parse URL OR Text content
      const results = await parseExternalTemplates(inputText);
      
      if (results.length === 0) {
        setError("未能识别出有效的模版结构。请确保内容包含“模版名称”和“Prompt指令”等关键信息。");
      } else {
        setFoundTemplates(results);
        setSelectedIds(new Set(results.map(t => t.id))); // Default select all
        setStep('preview');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "解析失败，请检查内容格式。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    const toImport = foundTemplates.filter(t => selectedIds.has(t.id));
    onImport(toImport);
    onClose();
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={
        <>
          <ClipboardPaste size={20} className="text-blue-600" />
          <span>导入模板数据</span>
        </>
      }
      footer={
        step === 'input' ? (
          <>
            <Button onClick={onClose} variant="secondary" className="flex-1">取消</Button>
            <Button 
              onClick={handleAnalyze} 
              className="flex-1" 
              disabled={!inputText.trim() || isLoading}
              isLoading={isLoading}
            >
              {isLoading ? 'AI 智能解析中...' : '开始解析'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setStep('input')} variant="secondary" className="flex-1">返回修改</Button>
            <Button 
              onClick={handleImport} 
              className="flex-1" 
              disabled={selectedIds.size === 0}
              icon={<Download size={16}/>}
            >
              导入 ({selectedIds.size})
            </Button>
          </>
        )
      }
    >
      {step === 'input' ? (
        <div className="space-y-4">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
              <div className="text-blue-500 mt-0.5 flex-shrink-0"><AlertCircle size={16} /></div>
              <div className="text-xs text-slate-500 leading-relaxed">
                 <p className="font-bold text-slate-700 mb-1">支持两种导入方式：</p>
                 <ul className="list-disc pl-3 space-y-1">
                    <li><strong>公开链接：</strong> 粘贴飞书多维表格/文档的公开分享链接（需允许匿名访问）。</li>
                    <li><strong>内容粘贴（推荐）：</strong> 直接选中表格中的数据区域（包含模版名、Prompt列），复制并粘贴到下方。</li>
                 </ul>
              </div>
           </div>
           
           <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">内容 / 链接</label>
              <textarea 
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all min-h-[120px] resize-none"
                placeholder="在此处粘贴 URL 链接，或直接粘贴表格文本内容..."
                value={inputText}
                onChange={(e) => {
                   setInputText(e.target.value);
                   setError(null);
                }}
                autoFocus
              />
           </div>

           {error && (
             <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
             </div>
           )}
        </div>
      ) : (
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">解析到 {foundTemplates.length} 个模板</span>
              <button 
                onClick={() => setSelectedIds(selectedIds.size === foundTemplates.length ? new Set() : new Set(foundTemplates.map(t => t.id)))}
                className="text-xs text-blue-600 hover:underline"
              >
                {selectedIds.size === foundTemplates.length ? '取消全选' : '全选'}
              </button>
           </div>
           
           <div className="space-y-2 max-h-[300px] overflow-y-auto -mx-2 px-2 custom-scrollbar">
              {foundTemplates.map(tpl => {
                const isSelected = selectedIds.has(tpl.id);
                return (
                  <div 
                    key={tpl.id}
                    onClick={() => toggleSelection(tpl.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  >
                     <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                        {isSelected && <Check size={12} />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                           <span className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>{tpl.name}</span>
                           <span className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded text-slate-500 border border-slate-100">{tpl.category}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded flex items-center gap-1">
                              <FileText size={8}/> {tpl.prompt ? '含指令' : '无指令'}
                           </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{tpl.description}</p>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}
    </BaseModal>
  );
};
