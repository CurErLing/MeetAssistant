
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, Play, Save, X, RotateCcw, StopCircle } from 'lucide-react';
import { Button } from '../../common/Button';
import { BaseModal } from '../BaseModal';
import { AudioEditor } from '../../audio-editor'; 
import { formatTime } from '../../../utils/formatUtils';

interface WebRecorderModalProps {
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

export const WebRecorderModal: React.FC<WebRecorderModalProps> = ({
  onConfirm,
  onCancel
}) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'preview'>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize recorder on mount
  useEffect(() => {
    const initStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          setStatus('preview');
          
          // Stop all tracks to release mic
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error("Failed to access microphone", err);
        alert("无法访问麦克风，请检查权限设置。");
        onCancel();
      }
    };

    initStream();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const startRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    chunksRef.current = [];
    mediaRecorderRef.current.start();
    setStatus('recording');
    startTimeRef.current = Date.now() - duration * 1000;
    
    timerRef.current = window.setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 100);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && status === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      startTimeRef.current = Date.now() - duration * 1000;
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleRetake = () => {
    setAudioBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDuration(0);
    chunksRef.current = [];
    setStatus('idle');
    
    // Re-init stream
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            setAudioBlob(blob);
            setPreviewUrl(URL.createObjectURL(blob));
            setStatus('preview');
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current = recorder;
    });
  };

  const handleConfirm = () => {
    if (audioBlob) {
      // Create a File object from Blob
      const file = new File([audioBlob], `会议录音_${new Date().toLocaleString().replace(/[\/\s:]/g, '_')}.webm`, { type: 'audio/webm' });
      onConfirm(file);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      maxWidth="max-w-lg"
      title={
        <>
          <Mic size={20} className="text-red-500" />
          <span>在线录音</span>
        </>
      }
      footer={
        status === 'preview' ? (
           <>
             <Button variant="secondary" onClick={handleRetake} icon={<RotateCcw size={16}/>}>重录</Button>
             <Button onClick={handleConfirm} icon={<Save size={16}/>} className="flex-1">保存录音</Button>
           </>
        ) : (
           <Button variant="secondary" className="w-full" onClick={onCancel}>取消</Button>
        )
      }
    >
      <div className="flex flex-col items-center justify-center py-6 space-y-8">
         
         {/* Timer Display */}
         <div className="text-center">
            <div className={`text-5xl font-mono font-bold tracking-wider mb-2 ${status === 'recording' ? 'text-slate-900' : 'text-slate-400'}`}>
               {formatTime(duration)}
            </div>
            <div className="flex items-center justify-center gap-2">
               <div className={`w-2 h-2 rounded-full ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`}></div>
               <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                 {status === 'idle' ? '准备就绪' : status === 'recording' ? '正在录音' : status === 'paused' ? '已暂停' : '录音预览'}
               </span>
            </div>
         </div>

         {/* Visualizer / Preview */}
         <div className="w-full h-32 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden relative">
            {status === 'preview' && previewUrl ? (
                <div className="w-full">
                   <AudioEditor 
                     url={previewUrl}
                     duration={duration}
                     compact={true}
                     className="border-none shadow-none bg-transparent"
                   />
                </div>
            ) : (
                <div className="flex items-end justify-center gap-1 h-12">
                   {/* Fake visualizer bars */}
                   {[...Array(20)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 bg-blue-500 rounded-full transition-all duration-150 ${status === 'recording' ? 'animate-pulse' : 'h-1 opacity-20'}`}
                        style={{ 
                           height: status === 'recording' ? `${Math.random() * 100}%` : '4px',
                           animationDelay: `${i * 0.05}s` 
                        }}
                      ></div>
                   ))}
                </div>
            )}
         </div>

         {/* Controls */}
         <div className="flex items-center gap-6">
            {status === 'idle' && (
               <button 
                 onClick={startRecording}
                 className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-200 transition-all hover:scale-105 active:scale-95"
               >
                  <Mic size={32} />
               </button>
            )}

            {(status === 'recording' || status === 'paused') && (
               <>
                  {status === 'recording' ? (
                     <button 
                       onClick={pauseRecording}
                       className="w-14 h-14 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full flex items-center justify-center transition-all"
                     >
                        <Pause size={24} fill="currentColor" />
                     </button>
                  ) : (
                     <button 
                       onClick={resumeRecording}
                       className="w-14 h-14 bg-red-100 text-red-500 hover:bg-red-200 rounded-full flex items-center justify-center transition-all"
                     >
                        <Mic size={24} />
                     </button>
                  )}

                  <button 
                    onClick={stopRecording}
                    className="w-20 h-20 bg-slate-900 text-white hover:bg-slate-800 rounded-full flex items-center justify-center shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
                  >
                     <StopCircle size={32} fill="currentColor" />
                  </button>
               </>
            )}
         </div>

      </div>
    </BaseModal>
  );
};
