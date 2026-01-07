
import React from 'react';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkip: (amount: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onSkip
}) => {
  return (
    <div className="flex items-center justify-center gap-8 pb-6">
      <button 
        onClick={() => onSkip(-15)} 
        className="text-slate-400 hover:text-blue-600 transition-colors p-2 group"
        title="后退 15 秒"
      >
        <div className="relative flex items-center justify-center">
          <RotateCcw size={28} strokeWidth={1.5} />
          <span className="absolute text-[9px] font-bold pt-0.5 select-none">15</span>
        </div>
      </button>
      
      <button 
        onClick={onTogglePlay}
        className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all"
      >
        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
      </button>

      <button 
        onClick={() => onSkip(15)} 
        className="text-slate-400 hover:text-blue-600 transition-colors p-2 group"
        title="前进 15 秒"
      >
        <div className="relative flex items-center justify-center">
          <RotateCw size={28} strokeWidth={1.5} />
          <span className="absolute text-[9px] font-bold pt-0.5 select-none">15</span>
        </div>
      </button>
    </div>
  );
};
