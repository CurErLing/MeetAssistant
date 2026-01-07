
import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioPlayerProps {
  url: string;
  trimStart: number;
  trimEnd: number; // if 0, treated as full duration
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
}

export const useAudioPlayer = ({
  url,
  trimStart,
  trimEnd,
  onTimeUpdate,
  onDurationChange
}: UseAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(trimStart);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const effectiveTrimEnd = trimEnd === 0 ? duration : trimEnd;

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Handle trim loop logic
  useEffect(() => {
    if (audioRef.current && !isPlaying) {
      // If paused and outside range (e.g. dragged trimmer), reset to start
      if (currentTime < trimStart - 0.1 || (effectiveTrimEnd > 0 && currentTime > effectiveTrimEnd + 0.1)) {
        // audioRef.current.currentTime = trimStart;
        // setCurrentTime(trimStart);
      }
    }
  }, [trimStart, effectiveTrimEnd, isPlaying, currentTime]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // If out of bounds, restart from trimStart
      if (audioRef.current.currentTime >= effectiveTrimEnd - 0.1 || audioRef.current.currentTime < trimStart) {
        audioRef.current.currentTime = trimStart;
      }
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, effectiveTrimEnd, trimStart]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      // Clamp time
      let newTime = Math.max(0, Math.min(time, duration));
      if (trimEnd > 0) {
        // Optional: strict clamping to trim region? 
        // For now, allow seeking anywhere, but playback might pause if outside.
      }
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration, trimEnd]);

  const skip = useCallback((amount: number) => {
    if (audioRef.current) {
      let newTime = audioRef.current.currentTime + amount;
      // Clamp within trim bounds if set
      const end = effectiveTrimEnd || duration;
      newTime = Math.max(trimStart, Math.min(end, newTime));
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [trimStart, effectiveTrimEnd, duration]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curr = audioRef.current.currentTime;
      setCurrentTime(curr);
      if (onTimeUpdate) onTimeUpdate(curr);

      // Auto-pause at end of trim
      if (effectiveTrimEnd > 0 && curr >= effectiveTrimEnd && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        audioRef.current.currentTime = trimStart;
        setCurrentTime(trimStart);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      setDuration(d);
      if (onDurationChange) onDurationChange(d);
    }
  };

  const handleEnded = () => setIsPlaying(false);

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    togglePlay,
    seek,
    skip,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded
  };
};
