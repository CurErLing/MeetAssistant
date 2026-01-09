
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Search } from 'lucide-react';
import { TranscriptSegment, Speaker, SpeakerStatus } from '../../../types';
import { TranscriptItem } from './TranscriptItem';
import { TranscriptToolbar } from './transcript/TranscriptToolbar';
import { useToast } from '../../common/Toast';

export const TranscriptView = ({
  transcript,
  speakers,
  currentTime,
  onUpdateTranscript,
  onSpeakerClick,
  onSeek,
  onManageSpeakers,
  uploadDate,
  readOnly = false,
  searchQuery = "" // Receive search query
}: {
  transcript: TranscriptSegment[];
  speakers: Record<string, Speaker>;
  currentTime: number;
  onUpdateTranscript: (updatedTranscript: TranscriptSegment[]) => void;
  onSpeakerClick: (speakerId: string) => void;
  onSeek: (time: number) => void;
  onManageSpeakers: () => void;
  uploadDate: Date;
  readOnly?: boolean;
  searchQuery?: string;
}) => {
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [segmentTextInput, setSegmentTextInput] = useState("");
  const { success } = useToast();
  
  const textInputRef = useRef("");
  const containerRef = useRef<HTMLDivElement>(null);
  // Track if we have already scrolled to the initial search match
  const hasScrolledToSearchRef = useRef(false);

  // --- Reset search scroll tracking when query changes ---
  useEffect(() => {
    hasScrolledToSearchRef.current = false;
  }, [searchQuery]);

  // --- Auto-Scroll Logic (Search & Playback) ---
  useEffect(() => {
    if (containerRef.current && !editingSegmentId) {
      const container = containerRef.current;

      // 1. Priority: Scroll to Search Result (First time only)
      if (searchQuery && !hasScrolledToSearchRef.current) {
        // Find the first element with the data attribute
        const matchEl = container.querySelector('[data-has-match="true"]') as HTMLElement;
        if (matchEl) {
           const offset = matchEl.offsetTop - container.offsetTop - 20; // 20px padding top
           container.scrollTo({ top: offset, behavior: 'smooth' });
           hasScrolledToSearchRef.current = true;
           return; // Skip playback scroll if we just jumped to search
        }
      }

      // 2. Playback Sync Scroll
      const activeSegment = transcript?.find(
        seg => currentTime >= seg.startTime && currentTime <= seg.endTime
      );
      if (activeSegment) {
        const element = document.getElementById(`segment-${activeSegment.id}`);
        if (element) {
          const offset = element.offsetTop - container.offsetTop - (container.clientHeight / 2) + (element.clientHeight / 2);
          // Only scroll if deviation is significant to avoid jitter
          if (Math.abs(container.scrollTop - offset) > 80) {
             container.scrollTo({ top: offset, behavior: 'smooth' });
          }
        }
      }
    }
  }, [currentTime, transcript, editingSegmentId, searchQuery]);

  const startEditingSegment = useCallback((seg: TranscriptSegment) => {
    if (readOnly) return;
    setEditingSegmentId(seg.id);
    setSegmentTextInput(seg.text);
    textInputRef.current = seg.text;
  }, [readOnly]);

  const handleInputChange = useCallback((val: string) => {
    setSegmentTextInput(val);
    textInputRef.current = val;
  }, []);

  const handleCancel = useCallback(() => {
    setEditingSegmentId(null);
  }, []);

  const saveSegmentText = useCallback(() => {
    if (!editingSegmentId || !transcript) return;
    const newText = textInputRef.current;
    const updatedTranscript = transcript.map(seg => seg.id === editingSegmentId ? { ...seg, text: newText } : seg);
    onUpdateTranscript(updatedTranscript);
    setEditingSegmentId(null);
  }, [editingSegmentId, transcript, onUpdateTranscript]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    success("已复制到剪贴板");
  }, [success]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* 顶部工具栏 */}
      {!readOnly && (
        <TranscriptToolbar 
          uploadDate={uploadDate}
          onManageSpeakers={onManageSpeakers}
        />
      )}
      
      {/* Search Result Indicator */}
      {searchQuery && (
         <div className="absolute top-0 left-0 right-0 z-10 bg-yellow-50 border-b border-yellow-100 px-4 py-2 flex items-center justify-center text-xs text-yellow-800 font-medium shadow-sm">
            <Search size={12} className="mr-2" />
            正在搜索关键词："{searchQuery}"
         </div>
      )}
      
      {/* 列表容器 */}
      <div 
        className={`flex-1 overflow-y-auto px-4 sm:px-10 py-4 sm:py-6 space-y-2 scroll-smooth ${searchQuery ? 'pt-10' : ''}`} 
        ref={containerRef}
      >
         {transcript?.map((segment) => {
           const isEditing = editingSegmentId === segment.id;
           return (
             <TranscriptItem 
                key={segment.id}
                segment={segment}
                speaker={speakers[segment.speakerId] || { 
                  id: segment.speakerId, 
                  name: '未知', 
                  color: 'text-slate-700', 
                  defaultLabel: '发言人', 
                  status: SpeakerStatus.UNKNOWN 
                }}
                isActive={currentTime >= segment.startTime && currentTime <= segment.endTime}
                isEditing={isEditing}
                inputValue={isEditing ? segmentTextInput : ""}
                searchQuery={searchQuery} // Pass down search query
                onSpeakerClick={onSpeakerClick}
                onSeek={onSeek}
                onEditClick={startEditingSegment}
                onCopy={handleCopy}
                onInputChange={handleInputChange}
                onSave={saveSegmentText}
                onCancel={handleCancel}
                readOnly={readOnly}
             />
           );
         })}
         
         {(!transcript || transcript.length === 0) && (
           <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                 <FileText size={32} className="text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400">暂无转写内容</p>
           </div>
         )}
      </div>
    </div>
  );
};
