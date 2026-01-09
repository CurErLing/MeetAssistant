
import React, { useEffect } from 'react';
import { useAudioPlayer } from './useAudioPlayer';
import { ProgressBar } from './ProgressBar';
import { PlaybackControls } from './PlaybackControls';
import { Trimmer } from './Trimmer';

interface AudioEditorProps {
  url: string;
  duration: number;
  trimStart?: number;
  trimEnd?: number;
  seekTo?: number | null;
  readOnly?: boolean;
  compact?: boolean;
  className?: string; // 新增：允许外部传入样式覆盖默认卡片样式
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onTrimChange?: (start: number, end: number) => void;
  onSaveTrim?: () => void;
}

export const AudioEditor: React.FC<AudioEditorProps> = ({
  url,
  duration,
  trimStart = 0,
  trimEnd = 0,
  seekTo = null,
  readOnly = false,
  compact = false,
  className = "",
  onTimeUpdate,
  onDurationChange,
  onTrimChange
}) => {
  const {
    audioRef,
    isPlaying,
    currentTime,
    duration: loadedDuration, // internal duration from metadata
    playbackRate,
    setPlaybackRate,
    togglePlay,
    seek,
    skip,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded
  } = useAudioPlayer({
    url,
    trimStart,
    trimEnd,
    onTimeUpdate,
    onDurationChange
  });

  // Handle external seek requests
  useEffect(() => {
    if (seekTo !== undefined && seekTo !== null) {
      if (Math.abs(currentTime - seekTo) > 0.1) {
        seek(seekTo);
      }
    }
  }, [seekTo, seek]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault(); // Prevent page scroll
          togglePlay();
          break;
        case 'ArrowLeft':
          skip(-5);
          break;
        case 'ArrowRight':
          skip(5);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, skip]);

  // Use the prop duration if available (it might be pre-calculated), otherwise use internal
  const displayDuration = duration > 0 ? duration : loadedDuration;

  // 默认样式包含圆角和边框，如果传入 className 则合并/覆盖
  // 移除 overflow-hidden 以支持下拉菜单显示
  const defaultClasses = `w-full bg-white select-none ${compact ? '' : 'shadow-sm rounded-xl border border-slate-200'}`;
  
  return (
    <div className={`${defaultClasses} ${className}`}>
       
       <ProgressBar 
          currentTime={currentTime}
          duration={displayDuration}
          trimStart={trimStart}
          trimEnd={trimEnd}
          playbackRate={playbackRate}
          readOnly={readOnly || !url}
          onSeek={seek}
          onRateChange={setPlaybackRate}
       />

       <PlaybackControls 
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onSkip={skip}
          disabled={!url}
       />

       {!readOnly && onTrimChange && (
         <Trimmer 
            duration={displayDuration}
            trimStart={trimStart}
            trimEnd={trimEnd}
            onTrimChange={onTrimChange}
         />
       )}

       <audio 
         ref={audioRef} 
         src={url || undefined} 
         onTimeUpdate={handleTimeUpdate} 
         onLoadedMetadata={handleLoadedMetadata} 
         onEnded={handleEnded} 
         className="hidden" 
       />
    </div>
  );
};
