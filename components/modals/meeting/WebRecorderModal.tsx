
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Pause, Save, RotateCcw, StopCircle } from 'lucide-react';
import { Button } from '../../common/Button';
import { BaseModal } from '../BaseModal';
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
      maxWidth="max-w-md"
      title="在线录音"
      footer={
        status === 'preview' ? (
          <>
            <Button variant="secondary" onClick={handleRetake} className="flex-1" icon={<RotateCcw size={16}/>}>重录</Button>
            <Button onClick={handleConfirm} className="flex-1" icon={<Save size={16}/>}>保存</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onCancel} className="w-full">取消</Button>
        )
      }
    >
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
         {/* Timer */}
         <div className="text-4xl font-mono font-bold text-slate-900 tracking-wider">
            {formatTime(duration)}
         </div>

         {/* Visualizer / Status */}
         {status === 'idle' && <p className="text-slate-400 text-sm">点击下方麦克风开始录音</p>}
         {status === 'recording' && (
            <div className="flex items-center gap-1 h-6">
               <div className="w-1 h-3 bg-red-500 rounded-full animate-pulse"></div>
               <div className="w-1 h-5 bg-red-500 rounded-full animate-pulse delay-75"></div>
               <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse delay-150"></div>
               <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse delay-100"></div>
               <div className="w-1 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
         )}
         {status === 'paused' && <p className="text-amber-500 font-bold text-sm">已暂停</p>}

         {/* Controls */}
         {status === 'preview' ? (
            <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
               <audio src={previewUrl || ""} controls className="w-full h-8" />
            </div>
         ) : (
            <div className="flex items-center gap-6">
               {status === 'idle' ? (
                  <button 
                    onClick={startRecording}
                    className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                  >
                     <Mic size={32} />
                  </button>
               ) : (
                  <>
                     {status === 'recording' ? (
                        <button 
                          onClick={pauseRecording}
                          className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center hover:bg-amber-200 transition-colors"
                        >
                           <Pause size={24} fill="currentColor" />
                        </button>
                     ) : (
                        <button 
                          onClick={resumeRecording}
                          className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                           <Mic size={24} />
                        </button>
                     )}

                     <button 
                       onClick={stopRecording}
                       className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                     >
                        <StopCircle size={32} fill="currentColor" />
                     </button>
                  </>
               )}
            </div>
         )}
      </div>
    </BaseModal>
  );
};
