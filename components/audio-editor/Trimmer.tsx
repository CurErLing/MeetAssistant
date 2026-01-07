
import React, { useRef, useState, useEffect } from 'react';
import { Scissors } from 'lucide-react';
import { formatTime } from '../../utils/formatUtils';

interface TrimmerProps {
  duration: number;
  trimStart: number;
  trimEnd: number;
  onTrimChange: (start: number, end: number) => void;
}

export const Trimmer: React.FC<TrimmerProps> = ({
  duration,
  trimStart,
  trimEnd,
  onTrimChange
}) => {
  const trimmerRef = useRef<HTMLDivElement>(null);
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);

  const effectiveTrimEnd = trimEnd === 0 ? duration : trimEnd;
  const durationSafe = duration > 0 ? duration : 1;
  
  const startPct = (trimStart / durationSafe) * 100;
  const endPct = (effectiveTrimEnd / durationSafe) * 100;
  const selectionWidth = endPct - startPct;

  const getClientX = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) return e.touches[0].clientX;
    return (e as MouseEvent).clientX;
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingHandle || !trimmerRef.current || duration <= 0) return;

      const clientX = getClientX(e);
      const rect = trimmerRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const time = ratio * duration;

      if (draggingHandle === 'start') {
        const newStart = Math.max(0, Math.min(time, effectiveTrimEnd - 0.5));
        onTrimChange(newStart, effectiveTrimEnd);
      } else {
        const newEnd = Math.max(trimStart + 0.5, Math.min(duration, time));
        onTrimChange(trimStart, newEnd);
      }
    };

    const handleUp = () => setDraggingHandle(null);

    if (draggingHandle) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [draggingHandle, duration, effectiveTrimEnd, trimStart, onTrimChange]);

  return (
    <div className="bg-slate-50 border-t border-slate-100 px-6 py-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
          <Scissors size={14} className="text-blue-500" /> 
          裁剪选区
        </span>
        <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">
          时长: {formatTime(effectiveTrimEnd - trimStart)}
        </span>
      </div>

      <div className="relative h-12 select-none group touch-none" ref={trimmerRef}>
        {/* Base Track */}
        <div className="absolute top-1/2 -mt-1.5 left-0 right-0 h-3 bg-slate-200 rounded-full"></div>
        
        {/* Active Region */}
        <div 
          className="absolute top-1/2 -mt-1.5 h-3 bg-blue-500/90 rounded-sm"
          style={{ left: `${startPct}%`, width: `${selectionWidth}%` }}
        ></div>

        {/* Start Handle */}
        <div 
          className="absolute top-0 bottom-0 w-8 -ml-4 cursor-ew-resize z-10 flex flex-col items-center justify-center group/handle hover:scale-110 transition-transform touch-none"
          style={{ left: `${startPct}%` }}
          onMouseDown={(e) => { e.stopPropagation(); setDraggingHandle('start'); }}
          onTouchStart={(e) => { e.stopPropagation(); setDraggingHandle('start'); }}
        >
          <div className="h-8 w-4 bg-white border border-slate-300 rounded shadow-sm flex items-center justify-center relative">
            <div className="w-0.5 h-3 bg-slate-300"></div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/handle:opacity-100 transition-opacity font-mono whitespace-nowrap hidden sm:block">
              {formatTime(trimStart)}
            </div>
          </div>
        </div>

        {/* End Handle */}
        <div 
          className="absolute top-0 bottom-0 w-8 -ml-4 cursor-ew-resize z-10 flex flex-col items-center justify-center group/handle hover:scale-110 transition-transform touch-none"
          style={{ left: `${endPct}%` }}
          onMouseDown={(e) => { e.stopPropagation(); setDraggingHandle('end'); }}
          onTouchStart={(e) => { e.stopPropagation(); setDraggingHandle('end'); }}
        >
          <div className="h-8 w-4 bg-white border border-slate-300 rounded shadow-sm flex items-center justify-center relative">
            <div className="w-0.5 h-3 bg-slate-300"></div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/handle:opacity-100 transition-opacity font-mono whitespace-nowrap hidden sm:block">
              {formatTime(effectiveTrimEnd)}
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-center text-slate-400 mt-2">
        拖动左右滑块选择需要保留的录音片段
      </p>
    </div>
  );
};
