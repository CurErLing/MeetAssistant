
import React, { useState, useEffect, useRef } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { MeetingFile, Template, ShareConfig } from '../../../types';
import { AudioEditor } from '../../audio-editor'; 
import { ShareHeader } from './ShareHeader';
import { TranscriptItem } from '../meeting/TranscriptItem';
import { AnalysisContent } from '../meeting/analysis/AnalysisContent';

export const ExternalShareView = ({ 
  meeting,
  templates = [],
  onExit,
  shareConfig
}: { 
  meeting: MeetingFile,
  templates?: Template[],
  onExit: () => void,
  shareConfig?: ShareConfig | null
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('transcript');
  const [seekTarget, setSeekTarget] = useState<number | null>(null);
  
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Configuration (Default to showing everything if no config passed)
  const showAudio = shareConfig ? shareConfig.shareAudio : true;
  const showTranscript = shareConfig ? shareConfig.shareTranscript : true;
  const allowedAnalyses = shareConfig ? shareConfig.selectedAnalyses : (meeting.analyses?.map(a => a.id) || []);

  // Filter analyses based on config
  const displayedAnalyses = meeting.analyses?.filter(a => allowedAnalyses.includes(a.id)) || [];

  // Reset activeTab if current tab is hidden by config
  useEffect(() => {
    if (activeTab === 'transcript' && !showTranscript) {
      if (displayedAnalyses.length > 0) {
        setActiveTab(displayedAnalyses[0].id);
      } else {
        setActiveTab('');
      }
    } else if (activeTab !== 'transcript' && !allowedAnalyses.includes(activeTab)) {
       if (showTranscript) {
         setActiveTab('transcript');
       } else if (displayedAnalyses.length > 0) {
         setActiveTab(displayedAnalyses[0].id);
       } else {
         setActiveTab('');
       }
    }
  }, [showTranscript, allowedAnalyses, activeTab, displayedAnalyses]);

  // Auto Scroll Logic for Transcript
  useEffect(() => {
    if (activeTab === 'transcript' && transcriptContainerRef.current) {
      const activeSegment = meeting.transcript?.find(
        seg => currentTime >= seg.startTime && currentTime <= seg.endTime
      );

      if (activeSegment) {
        const element = document.getElementById(`segment-readonly-${activeSegment.id}`);
        if (element) {
          const container = transcriptContainerRef.current;
          const offset = element.offsetTop - container.offsetTop - (container.clientHeight / 2) + (element.clientHeight / 2);
          if (Math.abs(container.scrollTop - offset) > 50) {
             container.scrollTo({ top: offset, behavior: 'smooth' });
          }
        }
      }
    }
  }, [currentTime, activeTab, meeting.transcript]);

  // Determine current content
  const currentAnalysis = displayedAnalyses.find(a => a.id === activeTab);

  return (
    <div className="flex flex-col h-screen bg-slate-50 animate-fade-in font-sans overflow-hidden">
       {/* 1. Header */}
       <ShareHeader meeting={meeting} onExit={onExit} />

       {/* 2. Tabs */}
       <div className="bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0 z-20">
         <div className="px-4 sm:px-6 py-2 flex items-center gap-6 overflow-x-auto no-scrollbar">
            {/* Transcript Tab */}
            {showTranscript && (
              <button 
                onClick={() => setActiveTab('transcript')}
                className={`text-sm font-bold transition-all px-1 py-3 relative whitespace-nowrap ${activeTab === 'transcript' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <div className="flex items-center gap-1.5">
                   <FileText size={16} />
                   转写逐字稿
                </div>
                {activeTab === 'transcript' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
              </button>
            )}

            {/* Analysis Tabs */}
            {displayedAnalyses.map((analysis) => {
              const template = templates.find(t => t.id === analysis.templateId);
              const label = template?.name || "智能分析";
              return (
                <button 
                  key={analysis.id}
                  onClick={() => setActiveTab(analysis.id)}
                  className={`text-sm font-bold transition-all px-1 py-3 relative whitespace-nowrap ${activeTab === analysis.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <div className="flex items-center gap-1.5">
                     <Sparkles size={16} />
                     {label}
                  </div>
                  {activeTab === analysis.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
              );
            })}
         </div>
       </div>

       {/* 3. Audio Player (Sticky) */}
       {showAudio && (
         <div className="flex-shrink-0 bg-white z-10 border-b border-slate-100">
             <AudioEditor 
                url={meeting.url}
                duration={meeting.duration}
                readOnly={true}
                onTimeUpdate={setCurrentTime}
                seekTo={seekTarget}
                compact={true}
                className="rounded-none border-x-0 border-t-0 border-b-0 shadow-none"
             />
         </div>
       )}

       {/* 4. Main Content */}
       <div className="flex-1 bg-white overflow-hidden relative flex flex-col">
           {activeTab === 'transcript' && showTranscript ? (
             <div 
               className="flex-1 overflow-y-auto scroll-smooth" 
               ref={transcriptContainerRef}
             >
               <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-2">
                  {meeting.transcript && meeting.transcript.length > 0 ? (
                    meeting.transcript.map((segment) => (
                      <TranscriptItem 
                        key={segment.id}
                        segment={segment}
                        speaker={meeting.speakers[segment.speakerId]}
                        isActive={currentTime >= segment.startTime && currentTime <= segment.endTime}
                        onSeek={(t) => setSeekTarget(t)}
                        readOnly={true}
                      />
                    ))
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                      <FileText size={48} className="mb-4 text-slate-200" />
                      <p>暂无转写内容</p>
                    </div>
                  )}
                  
                  {/* Bottom Padding */}
                  <div className="h-20"></div>
               </div>
             </div>
           ) : currentAnalysis ? (
             <AnalysisContent 
                content={currentAnalysis.content}
                analysisId={currentAnalysis.id}
                header={
                  <div className="mb-8 pb-4 border-b border-slate-50">
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {templates.find(t => t.id === currentAnalysis.templateId)?.name || "分析结果"}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                         <Sparkles size={12} />
                         <span>AI 生成内容</span>
                      </div>
                   </div>
                }
             />
           ) : (
             <div className="flex items-center justify-center h-full text-slate-400">
               <p>未找到内容或权限受限</p>
             </div>
           )}
       </div>
    </div>
  );
};
