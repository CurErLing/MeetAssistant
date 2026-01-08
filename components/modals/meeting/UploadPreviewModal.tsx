
import React, { useState, useEffect } from 'react';
import { Play, Pause, Scissors, RotateCcw, ZoomIn, ZoomOut, X } from 'lucide-react';
import { Button } from '../../common/Button';
import { sliceAudio } from '../../../services/audioUtils';
import { useAudioPlayer } from '../../audio-editor/useAudioPlayer';
import { WaveformEditor } from '../../audio-editor/WaveformEditor';
import { formatTime } from '../../../utils/formatUtils';
import { useToast } from '../../common/Toast';

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
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const { error, success } = useToast();
  
  // Trimming State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Audio Hook
  const {
    audioRef,
    isPlaying,
    currentTime,
    togglePlay,
    seek,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded
  } = useAudioPlayer({
    url: previewUrl,
    trimStart: trimStart,
    trimEnd: trimEnd,
    onDurationChange: (d) => {
        setDuration(d);
        if (trimEnd === 0) setTrimEnd(d);
    }
  });

  // Initialize
  useEffect(() => {
    const url = URL.createObjectURL(currentFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [currentFile]);

  const handleCrop = async () => {
    if (isProcessing) return;
    // Validate range
    if (trimStart <= 0 && (trimEnd >= duration || trimEnd === 0)) {
       return; // No crop needed
    }

    setIsProcessing(true);
    try {
      const newFile = await sliceAudio(currentFile, trimStart, trimEnd);
      setCurrentFile(newFile);
      // Reset trimmer will happen automatically when duration updates
      setTrimStart(0);
      setTrimEnd(0); 
      success("裁剪成功");
    } catch (e) {
      console.error("Processing failed", e);
      error("裁剪失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(parseFloat(e.target.value));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      {/* Main Card Container */}
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-slide-up ring-1 ring-white/20">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0 bg-white z-10">
           <div className="min-w-0 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                 <Scissors size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 truncate max-w-xs sm:max-w-md">{currentFile.name}</h2>
                <div className="text-[10px] text-slate-400">音频裁剪预处理</div>
              </div>
           </div>
           <button 
             onClick={onCancel} 
             className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
           >
              <X size={20} />
           </button>
        </div>

        {/* Main Waveform Area - Restrict height to make it look like a track */}
        <div className="flex-1 bg-slate-50/50 relative overflow-hidden flex flex-col min-h-[280px]">
           {/* Audio Element (Hidden) */}
           <audio 
             ref={audioRef} 
             src={previewUrl} 
             onTimeUpdate={handleTimeUpdate} 
             onLoadedMetadata={handleLoadedMetadata} 
             onEnded={handleEnded} 
             className="hidden" 
           />

           {/* Visualizer Container */}
           <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative px-0 flex flex-col justify-center select-none">
              <div className="w-full h-full min-h-[200px] relative">
                 <WaveformEditor 
                    currentTime={currentTime}
                    duration={duration}
                    trimStart={trimStart}
                    trimEnd={trimEnd || duration}
                    onSeek={seek}
                    onTrimChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }}
                    zoomLevel={zoomLevel}
                 />
              </div>
           </div>
        </div>
        
        {/* Bottom Controls Panel */}
        <div className="bg-white border-t border-slate-100 flex flex-col pb-6 pt-4 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10">
           
           {/* Time & Zoom Row */}
           <div className="w-full flex items-center justify-between mb-4">
              {/* Zoom Slider */}
              <div className="flex items-center gap-2 w-32">
                 <ZoomOut size={14} className="text-slate-400" />
                 <input 
                   type="range" 
                   min="1" 
                   max="5" 
                   step="0.1" 
                   value={zoomLevel} 
                   onChange={handleZoom}
                   className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600 hover:accent-slate-700"
                 />
                 <ZoomIn size={14} className="text-slate-400" />
              </div>

              {/* Big Timer */}
              <div className="text-center absolute left-1/2 -translate-x-1/2">
                 <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
                    {formatTime(currentTime)}
                 </div>
              </div>

              {/* Duration Info */}
              <div className="text-xs font-mono text-slate-400 text-right w-32 tabular-nums">
                 {formatTime(trimStart)} - {formatTime(trimEnd || duration)}
              </div>
           </div>

           <div className="h-px bg-slate-100 w-full mb-4"></div>

           {/* Action Buttons Row */}
           <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-start">
                 <button 
                   onClick={() => {
                      setTrimStart(0);
                      setTrimEnd(duration);
                   }}
                   disabled={trimStart === 0 && (trimEnd === 0 || trimEnd === duration)}
                   className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                 >
                    <RotateCcw size={14} /> 重置选区
                 </button>
              </div>

              <div className="flex items-center gap-6">
                 <button 
                   onClick={togglePlay}
                   className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200"
                 >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                 </button>

                 <button 
                   onClick={handleCrop}
                   disabled={isProcessing || (trimStart === 0 && (trimEnd === 0 || trimEnd === duration))}
                   className="flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                   title="裁剪并保留选区"
                 >
                    <Scissors size={20} />
                 </button>
              </div>

              <div className="flex-1 flex justify-end gap-3">
                 <Button variant="secondary" onClick={onCancel} className="px-5">取消</Button>
                 <Button 
                   onClick={() => onConfirm(currentFile, trimStart, trimEnd)} 
                   className="px-6 shadow-md shadow-blue-200"
                   disabled={isProcessing}
                 >
                   确认使用
                 </Button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
