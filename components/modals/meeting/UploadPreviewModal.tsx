
import React, { useState, useEffect } from 'react';
import { Upload, FileAudio, Info, Scissors, Trash2, Undo, Loader2 } from 'lucide-react';
import { Button } from '../../common/Button';
import { AudioEditor } from '../../audio-editor'; 
import { BaseModal } from '../BaseModal';
import { sliceAudio, deleteAudioRange } from '../../../services/audioUtils';

export const UploadPreviewModal = ({
  file,
  onConfirm,
  onCancel
}: {
  file: File,
  onConfirm: (file: File, trimStart: number, trimEnd: number) => void,
  onCancel: () => void
}) => {
  const [currentFile, setCurrentFile] = useState<File>(file);
  const [history, setHistory] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  
  // Trimming State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize
  useEffect(() => {
    const url = URL.createObjectURL(currentFile);
    setPreviewUrl(url);
    // Reset trimmer when file changes (except duration which is handled by AudioEditor)
    return () => URL.revokeObjectURL(url);
  }, [currentFile]);

  const handleDurationChange = (d: number) => {
    setDuration(d);
    // Always reset trim handles to full width when file changes/loads
    setTrimStart(0);
    setTrimEnd(d);
  };

  const addToHistory = () => {
    setHistory(prev => [...prev, currentFile]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prevFile = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentFile(prevFile);
  };

  const handleProcessAudio = async (type: 'keep' | 'delete') => {
    if (isProcessing) return;
    
    // Validate range
    if (trimStart <= 0 && trimEnd >= duration) {
       // If full range selected
       if (type === 'delete') {
         alert("无法删除整个音频文件");
         return;
       }
       // If crop, it's a no-op
       return;
    }

    setIsProcessing(true);
    addToHistory();

    try {
      let newFile: File;
      if (type === 'keep') {
        newFile = await sliceAudio(currentFile, trimStart, trimEnd);
      } else {
        newFile = await deleteAudioRange(currentFile, trimStart, trimEnd);
      }
      
      setCurrentFile(newFile);
      // Trimmer will be reset via handleDurationChange -> but we might need to force reset component state if needed.
      // AudioEditor's useEffect on url change will reload it.
    } catch (e) {
      console.error("Processing failed", e);
      alert("处理音频失败，请重试");
      // Revert history if failed
      setHistory(prev => prev.slice(0, -1));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      maxWidth="max-w-2xl"
      title={
        <>
          <Upload size={18} className="text-blue-600"/>
          <span>录音预览与编辑</span>
        </>
      }
      footer={
        <>
          <Button onClick={onCancel} variant="secondary" className="flex-1">取消</Button>
          <Button 
            onClick={() => onConfirm(currentFile, trimStart, trimEnd)} 
            className="flex-1"
            disabled={isProcessing}
          >
            确认上传
          </Button>
        </>
      }
    >
      <div className="space-y-6">
         {/* File Info */}
         <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileAudio size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 truncate text-lg">{currentFile.name}</div>
              <div className="text-sm text-slate-500 font-mono">{(currentFile.size / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
            {history.length > 0 && (
               <button 
                 onClick={handleUndo}
                 className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                 title="撤销上一步操作"
               >
                 <Undo size={16} /> 撤销
               </button>
            )}
         </div>

         {/* Editor */}
         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden relative">
           {isProcessing && (
             <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-blue-600">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span className="text-sm font-bold">正在处理音频...</span>
             </div>
           )}
           
           {previewUrl && (
             <AudioEditor 
               url={previewUrl}
               duration={duration}
               trimStart={trimStart}
               trimEnd={trimEnd}
               onDurationChange={handleDurationChange}
               onTrimChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }}
             />
           )}

           {/* Editing Toolbar */}
           <div className="flex items-center justify-between p-3 bg-slate-50 border-t border-slate-100">
              <div className="flex gap-2 w-full">
                 <button
                   onClick={() => handleProcessAudio('keep')}
                   className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                   disabled={isProcessing || duration === 0}
                   title="删除选区之外的内容"
                 >
                    <Scissors size={14} /> 仅保留选区
                 </button>
                 <button
                   onClick={() => handleProcessAudio('delete')}
                   className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-xs font-bold text-slate-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                   disabled={isProcessing || duration === 0}
                   title="删除当前选中的内容"
                 >
                    <Trash2 size={14} /> 删除选区
                 </button>
              </div>
           </div>
         </div>
         
         <div className="flex items-start gap-2 text-xs text-slate-500 bg-blue-50 p-3 rounded-lg text-blue-700">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>
              拖动蓝色滑块选择区域。您可以<strong>“仅保留”</strong>蓝色区域（裁剪），或<strong>“删除”</strong>蓝色区域（剪切中间部分）。
              <br/>所有编辑操作均可撤销。
            </p>
         </div>
      </div>
    </BaseModal>
  );
};
