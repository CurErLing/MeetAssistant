
import React, { useState, useRef, useEffect } from 'react';
import { Fingerprint, Trash2, Play, Pause, Loader2 } from 'lucide-react';
import { VoiceprintProfile } from '../../../types';
import { getAudioBlob } from '../../../services/storage';

interface VoiceprintCardProps {
  voiceprint: VoiceprintProfile;
  onClick: () => void;
  onDelete: () => void;
}

export const VoiceprintCard: React.FC<VoiceprintCardProps> = ({ voiceprint, onClick, onDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if audio exists on mount
  useEffect(() => {
    let active = true;
    const checkAudio = async () => {
      try {
        const blob = await getAudioBlob(voiceprint.id);
        if (active && blob) {
          setHasAudio(true);
        }
      } catch (e) {
        // ignore
      }
    };
    checkAudio();
    return () => { active = false; };
  }, [voiceprint.id]);

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      setIsLoading(true);
      try {
        const blob = await getAudioBlob(voiceprint.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => setIsPlaying(false);
          audioRef.current = audio;
          await audio.play();
          setIsPlaying(true);
        } else {
            // No audio found
            setHasAudio(false);
        }
      } catch (err) {
        console.error("Failed to play voiceprint audio", err);
      } finally {
        setIsLoading(false);
      }
    } else {
        await audioRef.current.play();
        setIsPlaying(true);
    }
  };

  useEffect(() => {
      // Cleanup audio URL on unmount
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
      };
  }, []);

  return (
    <div 
      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative cursor-pointer"
      onClick={onClick}
      title="点击修改"
    >
       <button 
         onClick={(e) => {
           e.stopPropagation();
           onDelete();
         }}
         className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-20"
         title="删除声纹"
       >
         <Trash2 size={16} />
       </button>

       <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
             <div 
               className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200 relative group/icon"
               onClick={hasAudio ? togglePlay : undefined}
               title={hasAudio ? "点击预览声音" : "无声音数据"}
             >
                {/* Play Overlay */}
                {hasAudio && (
                   <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity">
                      {isLoading ? (
                          <Loader2 size={20} className="animate-spin" />
                      ) : isPlaying ? (
                          <Pause size={20} fill="currentColor" />
                      ) : (
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                      )}
                   </div>
                )}
                {voiceprint.name.charAt(0)}
             </div>
             <div>
                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{voiceprint.name}</h4>
                <span className="text-xs text-slate-400 font-mono">{voiceprint.id}</span>
             </div>
          </div>
       </div>
       <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
             <Fingerprint size={12} className={hasAudio ? "text-indigo-500" : "text-slate-300"} />
             <span>{hasAudio ? '已注册声音' : '仅元数据'}</span>
          </div>
          <span>{voiceprint.createdAt.toLocaleDateString()}</span>
       </div>
       <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-100 rounded-xl pointer-events-none transition-colors z-10"></div>
    </div>
  );
};
