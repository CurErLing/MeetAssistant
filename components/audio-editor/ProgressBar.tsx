
import React, { useRef, useEffect, useState } from 'react';
import { Gauge, Check } from 'lucide-react';
import { formatTime } from '../../utils/formatUtils';
import { useClickOutside } from '../../hooks/useClickOutside';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  playbackRate: number;
  readOnly: boolean;
  onSeek: (time: number) => void;
  onRateChange: (rate: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  trimStart,
  trimEnd,
  playbackRate,
  readOnly,
  onSeek,
  onRateChange
}) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useClickOutside(menuRef, () => setIsMenuOpen(false), isMenuOpen);

  const durationSafe = duration > 0 ? duration : 1;
  const playPct = (currentTime / durationSafe) * 100;
  const startPct = (trimStart / durationSafe) * 100;
  const effectiveEnd = trimEnd === 0 ? duration : trimEnd;
  const endPct = (effectiveEnd / durationSafe) * 100;
  const selectionWidth = endPct - startPct;

  const RATES = [0.5, 1.0, 1.25, 1.5, 2.0];

  const getClientX = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) return e.touches[0].clientX;
    return (e as MouseEvent).clientX;
  };

  const handleSeek = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (progressRef.current && duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const clientX = getClientX(e);
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    handleSeek(e);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) handleSeek(e);
    };
    const handleUp = () => setIsDragging(false);

    if (isDragging) {
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
  }, [isDragging, duration]);

  return (
    <div className="px-6 pt-6 pb-2">
      {/* Track */}
      <div 
        className="relative h-6 flex items-center cursor-pointer group touch-none"
        ref={progressRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div className="absolute left-0 right-0 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          {!readOnly && (
            <div 
              className="absolute h-full bg-slate-200"
              style={{ left: `${startPct}%`, width: `${selectionWidth}%` }}
            ></div>
          )}
          <div 
            className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
            style={{ width: `${playPct}%` }}
          ></div>
        </div>
        <div 
          className="absolute top-1/2 -mt-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md transform -translate-x-1/2 transition-transform hover:scale-125 z-10"
          style={{ left: `${playPct}%` }}
        ></div>
      </div>

      {/* Info */}
      <div className="flex justify-between items-center mt-1">
        <div className="text-xs font-mono font-medium text-slate-500">
          <span className="text-slate-900">{formatTime(currentTime)}</span> 
          <span className="mx-1 text-slate-300">/</span> 
          {formatTime(duration)}
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 bg-slate-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            <Gauge size={12} /> {playbackRate}x
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-28 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-20 animate-slide-up origin-top-right overflow-hidden">
                {RATES.map(rate => (
                  <button
                    key={rate}
                    onClick={() => {
                      onRateChange(rate);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-between ${playbackRate === rate ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                  >
                     <span>{rate}x</span>
                     {playbackRate === rate && <Check size={12} />}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
