
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { formatTime } from '../../utils/formatUtils';

interface WaveformEditorProps {
  currentTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  onSeek: (time: number) => void;
  onTrimChange: (start: number, end: number) => void;
  zoomLevel: number; // 1 to 5
}

export const WaveformEditor: React.FC<WaveformEditorProps> = ({
  currentTime,
  duration,
  trimStart,
  trimEnd,
  onSeek,
  onTrimChange,
  zoomLevel
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'seek' | 'start' | 'end' | null>(null);

  // Constants
  const effectiveTrimEnd = trimEnd === 0 ? duration : trimEnd;
  const durationSafe = duration > 0 ? duration : 1;

  // Generate fake waveform bars (stable across renders)
  const bars = useMemo(() => {
    const count = 200 * zoomLevel; 
    return Array.from({ length: count }).map((_, i) => ({
      height: 15 + Math.random() * 85, // 15% to 100% height
      id: i
    }));
  }, [zoomLevel]);

  // Generate ruler ticks
  const ticks = useMemo(() => {
    const tickCount = 12 * zoomLevel;
    const interval = durationSafe / tickCount;
    return Array.from({ length: tickCount + 1 }).map((_, i) => ({
      time: i * interval,
      label: formatTime(i * interval)
    }));
  }, [durationSafe, zoomLevel]);

  // Handlers
  const getTimeFromEvent = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as any).clientX;
    const relativeX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (relativeX / rect.width) * durationSafe;
  };

  const handleStart = (type: 'seek' | 'start' | 'end', e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setDragging(type);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const time = getTimeFromEvent(e);

      if (dragging === 'seek') {
        onSeek(time);
      } else if (dragging === 'start') {
        const newStart = Math.min(time, effectiveTrimEnd - 0.5);
        onTrimChange(Math.max(0, newStart), effectiveTrimEnd);
      } else if (dragging === 'end') {
        const newEnd = Math.max(time, trimStart + 0.5);
        onTrimChange(trimStart, Math.min(durationSafe, newEnd));
      }
    };

    const handleUp = () => setDragging(null);

    if (dragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging, durationSafe, trimStart, effectiveTrimEnd, onSeek, onTrimChange]);

  // Calculations for positioning
  const playPercent = (currentTime / durationSafe) * 100;
  const startPercent = (trimStart / durationSafe) * 100;
  const endPercent = (effectiveTrimEnd / durationSafe) * 100;
  const selectionWidth = endPercent - startPercent;

  return (
    <div className="relative w-full h-full select-none flex flex-col bg-[#F3F4F6]">
      {/* Ruler */}
      <div className="h-8 flex justify-between items-end px-2 text-[10px] text-slate-400 border-b border-slate-200 bg-white relative z-20 shadow-sm">
        {ticks.map((tick, i) => (
           // Show ticks nicely spaced
           (zoomLevel > 2 || i % 2 === 0) && (
             <div key={i} style={{ left: `${(tick.time / durationSafe) * 100}%`, position: 'absolute', transform: 'translateX(-50%)' }} className="flex flex-col items-center">
               <div className="h-1.5 w-px bg-slate-300 mb-0.5"></div>
               <span>{tick.label}</span>
             </div>
           )
        ))}
      </div>

      {/* Waveform Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative flex items-center justify-between gap-[1px] py-10 px-0 cursor-crosshair overflow-hidden"
        onMouseDown={(e) => handleStart('seek', e)}
        onTouchStart={(e) => handleStart('seek', e)}
      >
        {/* Background Grid Lines (Optional decoration) */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
           <div className="h-full w-full border-b border-slate-900 absolute top-1/2 -translate-y-1/2"></div>
        </div>

        {/* Bars */}
        {bars.map((bar) => (
          <div 
            key={bar.id}
            className="flex-1 bg-slate-400 rounded-sm transition-all hover:bg-slate-500"
            style={{ height: `${bar.height}%`, opacity: 0.6 }}
          />
        ))}

        {/* Selection Overlay (The "Crop" Area) - Orange Style */}
        <div 
          className="absolute top-0 bottom-0 bg-orange-500/20 border-l border-r border-orange-500/50 z-10 pointer-events-none"
          style={{ left: `${startPercent}%`, width: `${selectionWidth}%` }}
        >
           {/* Center Line visual */}
           <div className="absolute top-1/2 left-0 right-0 h-px bg-orange-500/30"></div>
        </div>

        {/* Mask Overlay (Darken area outside selection) */}
        <div className="absolute top-0 bottom-0 left-0 bg-slate-900/5 pointer-events-none z-0" style={{ width: `${startPercent}%` }}></div>
        <div className="absolute top-0 bottom-0 right-0 bg-slate-900/5 pointer-events-none z-0" style={{ left: `${endPercent}%` }}></div>

        {/* Left Handle */}
        <div 
          className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize z-30 flex flex-col items-center justify-center group touch-none"
          style={{ left: `${startPercent}%` }}
          onMouseDown={(e) => handleStart('start', e)}
          onTouchStart={(e) => handleStart('start', e)}
        >
           <div className="absolute top-0 bottom-0 w-[2px] bg-blue-600"></div>
           <div className="h-10 w-3 bg-white border border-blue-500 rounded shadow-md flex flex-col gap-0.5 items-center justify-center z-40 hover:scale-110 transition-transform">
              <div className="w-0.5 h-4 bg-blue-500 rounded-full opacity-50"></div>
           </div>
           <div className="absolute top-2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-mono">
             {formatTime(trimStart)}
           </div>
        </div>

        {/* Right Handle */}
        <div 
          className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize z-30 flex flex-col items-center justify-center group touch-none"
          style={{ left: `${endPercent}%` }}
          onMouseDown={(e) => handleStart('end', e)}
          onTouchStart={(e) => handleStart('end', e)}
        >
           <div className="absolute top-0 bottom-0 w-[2px] bg-blue-600"></div>
           <div className="h-10 w-3 bg-white border border-blue-500 rounded shadow-md flex flex-col gap-0.5 items-center justify-center z-40 hover:scale-110 transition-transform">
              <div className="w-0.5 h-4 bg-blue-500 rounded-full opacity-50"></div>
           </div>
           <div className="absolute top-2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-mono">
             {formatTime(effectiveTrimEnd)}
           </div>
        </div>

        {/* Playback Cursor */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20 pointer-events-none transition-all duration-75 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
          style={{ left: `${playPercent}%` }}
        >
           <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-red-500 -ml-[4px] absolute top-0"></div>
        </div>

      </div>
    </div>
  );
};
