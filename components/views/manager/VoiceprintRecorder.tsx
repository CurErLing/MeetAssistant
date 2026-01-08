
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Mic2, RefreshCw, Check, Upload, FileAudio, X } from 'lucide-react';
import { Button } from '../../common/Button';
import { BaseModal } from '../../modals/BaseModal';
import { useToast } from '../../common/Toast';

export const VoiceprintRecorder = ({
  initialName = "",
  onClose,
  onSave
}: {
  initialName?: string;
  onClose: () => void;
  onSave: (name: string, file: Blob | null) => void;
}) => {
  const [newName, setNewName] = useState(initialName);
  const [mode, setMode] = useState<'record' | 'upload'>('record');
  const [step, setStep] = useState<'idle' | 'working' | 'processing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const { error } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStart = async () => {
    if (!newName.trim()) return;
    if (mode === 'upload' && !selectedFile) return;

    if (mode === 'record') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];
            
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                setStep('processing');
                stream.getTracks().forEach(track => track.stop());
                setTimeout(() => setStep('done'), 1500); // Simulate analysis delay
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setStep('working');

            // Record for 5 seconds for voiceprint sample
            let p = 0;
            const interval = setInterval(() => {
                p += 2; // 50 * 2 = 100% in 5s (approx if interval is 100ms)
                setProgress(Math.min(p, 100));
                if (p >= 100) {
                    clearInterval(interval);
                    recorder.stop();
                }
            }, 100);

        } catch (err) {
            console.error("Mic error", err);
            error("无法访问麦克风");
        }
    } else {
        // Upload Mode
        setStep('working');
        let p = 0;
        const interval = setInterval(() => {
            p += 10;
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setRecordedBlob(selectedFile); // Use the uploaded file as the blob
                setStep('processing');
                setTimeout(() => setStep('done'), 1000);
            }
        }, 100);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title={initialName ? "更新声纹音频" : "录入新声纹"}
      footer={
         step === 'done' ? (
           <Button onClick={() => onSave(newName, recordedBlob)} className="w-full">完成并保存</Button>
         ) : (
           <>
             <Button variant="secondary" onClick={onClose} className="flex-1" disabled={step !== 'idle'}>取消</Button>
             <Button 
               onClick={handleStart} 
               className="flex-1" 
               disabled={!newName.trim() || (mode === 'upload' && !selectedFile) || step !== 'idle'}
               isLoading={step === 'working' || step === 'processing'}
             >
               {mode === 'record' ? '开始录音' : '上传并处理'}
             </Button>
           </>
         )
      }
    >
      <div className="space-y-6">
        {/* Name Input */}
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">发言人姓名</label>
           <input 
             className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
             placeholder="输入姓名"
             value={newName}
             onChange={(e) => setNewName(e.target.value)}
             disabled={step !== 'idle'}
             autoFocus={!initialName}
           />
        </div>

        {/* Mode Switcher */}
        {step === 'idle' && (
           <div className="flex p-1 bg-slate-100 rounded-lg">
              <button 
                onClick={() => setMode('record')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${mode === 'record' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Mic size={16} /> 麦克风录入
              </button>
              <button 
                onClick={() => setMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${mode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Upload size={16} /> 上传音频文件
              </button>
           </div>
        )}

        {/* Content Area */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 min-h-[200px] flex flex-col items-center justify-center">
            
            {/* Idle - Record Mode */}
            {step === 'idle' && mode === 'record' && (
                <div className="text-center max-w-sm">
                   <div className="w-16 h-16 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mic size={32} />
                   </div>
                   <p className="text-slate-600 text-sm mb-4">请确保环境安静，点击下方按钮开始朗读提示文本 (约5秒)。</p>
                   <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-500 text-left italic shadow-sm">
                     "今天是一个美好的日子，积木会议助手致力于利用人工智能技术提高会议效率..."
                   </div>
                </div>
            )}

            {/* Idle - Upload Mode */}
            {step === 'idle' && mode === 'upload' && (
                <div className="text-center w-full">
                   <input type="file" ref={fileInputRef} className="hidden" accept=".wav,.mp3,.m4a" onChange={handleFileChange} />
                   {!selectedFile ? (
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-100 hover:border-blue-400 cursor-pointer transition-colors group"
                     >
                        <Upload size={32} className="mx-auto text-slate-300 mb-2 group-hover:text-blue-500 transition-colors" />
                        <p className="text-sm font-bold text-slate-600 group-hover:text-blue-600">点击上传音频文件</p>
                        <p className="text-xs text-slate-400 mt-1">支持 WAV, MP3, M4A (建议 5秒以上)</p>
                     </div>
                   ) : (
                     <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                           <FileAudio size={24} />
                        </div>
                        <div className="text-left">
                           <div className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{selectedFile.name}</div>
                           <div className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <button onClick={() => setSelectedFile(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                           <X size={18} />
                        </button>
                     </div>
                   )}
                </div>
            )}

            {/* Working (Recording or Uploading) */}
            {step === 'working' && (
               <div className="text-center w-full max-w-xs">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto ${mode === 'record' ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-blue-50 text-blue-500'}`}>
                    {mode === 'record' ? <Mic2 size={32} /> : <Upload size={32} className="animate-bounce" />}
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-100 ${mode === 'record' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mt-3">
                    {mode === 'record' ? '正在录音...' : '正在上传...'}
                  </p>
               </div>
            )}

            {/* Processing */}
            {step === 'processing' && (
                <div className="text-center">
                  <RefreshCw size={40} className="text-indigo-500 animate-spin mb-4 mx-auto" />
                  <p className="text-sm font-medium text-slate-600">正在提取声纹特征...</p>
                </div>
            )}

            {/* Done */}
            {step === 'done' && (
                <div className="text-center animate-fade-in">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Check size={32} />
                  </div>
                  <p className="text-lg font-bold text-slate-900">声纹录入成功</p>
                  <p className="text-sm text-slate-500 mt-1">系统已成功提取特征，将自动识别该发言人。</p>
                </div>
            )}
        </div>
      </div>
    </BaseModal>
  );
};
