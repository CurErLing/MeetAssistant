
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { TranscriptSegment, Speaker, SpeakerStatus } from '../../../types';
import { TranscriptItem } from './TranscriptItem';
import { TranscriptToolbar } from './transcript/TranscriptToolbar';

export const TranscriptView = ({
  transcript,
  speakers,
  currentTime,
  onUpdateTranscript,
  onSpeakerClick,
  onSeek,
  onManageSpeakers,
  uploadDate,
  readOnly = false
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
}) => {
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [segmentTextInput, setSegmentTextInput] = useState("");
  
  // 使用 Ref 存储最新的输入值
  const textInputRef = useRef("");
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 自动滚动逻辑 ---
  useEffect(() => {
    if (containerRef.current && !editingSegmentId) {
      const activeSegment = transcript?.find(
        seg => currentTime >= seg.startTime && currentTime <= seg.endTime
      );
      if (activeSegment) {
        const element = document.getElementById(`segment-${activeSegment.id}`);
        if (element) {
          const container = containerRef.current;
          const offset = element.offsetTop - container.offsetTop - (container.clientHeight / 2) + (element.clientHeight / 2);
          
          if (Math.abs(container.scrollTop - offset) > 50) {
             container.scrollTo({ top: offset, behavior: 'smooth' });
          }
        }
      }
    }
  }, [currentTime, transcript, editingSegmentId]);

  // 稳定的回调函数
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
    alert("已复制到剪贴板");
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* 顶部工具栏 (组件化) */}
      {!readOnly && (
        <TranscriptToolbar 
          uploadDate={uploadDate}
          onManageSpeakers={onManageSpeakers}
        />
      )}
      
      {/* 列表容器 */}
      <div 
        className="flex-1 overflow-y-auto px-4 sm:px-10 py-4 sm:py-6 space-y-2 scroll-smooth" 
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
