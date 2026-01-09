
import React from 'react';
import { Wand2 } from 'lucide-react';
import { MeetingFile, Template, AnalysisResult, TranscriptSegment } from '../../../types';
import { TemplatePickerView } from './TemplatePickerView';
import { TranscriptView } from './TranscriptView';
import { AnalysisView } from './AnalysisView';
import { EmptyState } from '../../EmptyState';
import { Button } from '../../common/Button';

interface MeetingContentProps {
  isSelectingTemplate: boolean;
  activeTab: string;
  meeting: MeetingFile;
  templates: Template[];
  currentTime: number;
  currentAnalysis?: AnalysisResult;
  editingAnalysisId: string | null;
  onSelectTemplate: (id: string) => void;
  onCloseTemplatePicker: () => void;
  onUpdateTranscript: (transcript: TranscriptSegment[]) => void;
  onSpeakerClick: (id: string) => void;
  onSeek: (time: number) => void;
  onManageSpeakers: () => void;
  onUpdateAnalysis: (id: string, updates: Partial<AnalysisResult>) => void;
  onCancelEdit: () => void;
  onDeleteAnalysis: (id: string) => void;
  onBackToTranscript: () => void;
  readOnly?: boolean;
  searchQuery?: string; // Prop for search highlighting
}

export const MeetingContent: React.FC<MeetingContentProps> = ({
  isSelectingTemplate,
  activeTab,
  meeting,
  templates,
  currentTime,
  currentAnalysis,
  editingAnalysisId,
  onSelectTemplate,
  onCloseTemplatePicker,
  onUpdateTranscript,
  onSpeakerClick,
  onSeek,
  onManageSpeakers,
  onUpdateAnalysis,
  onCancelEdit,
  onDeleteAnalysis,
  onBackToTranscript,
  readOnly = false,
  searchQuery = ""
}) => {
  if (isSelectingTemplate) {
    return (
      <TemplatePickerView 
        templates={templates} 
        onSelect={onSelectTemplate} 
        onClose={onCloseTemplatePicker} 
      />
    );
  }

  if (activeTab === 'transcript') {
    return (
      <TranscriptView 
        transcript={meeting.transcript || []}
        speakers={meeting.speakers || {}} 
        currentTime={currentTime}
        onUpdateTranscript={onUpdateTranscript}
        onSpeakerClick={onSpeakerClick}
        onSeek={onSeek}
        onManageSpeakers={onManageSpeakers}
        uploadDate={meeting.uploadDate}
        readOnly={readOnly}
        searchQuery={searchQuery}
      />
    );
  }

  if (currentAnalysis) {
    return (
      <AnalysisView 
        key={currentAnalysis.id}
        analysis={currentAnalysis}
        template={templates.find(t => t.id === currentAnalysis.templateId)}
        onUpdate={(updates) => onUpdateAnalysis(currentAnalysis.id, updates)}
        isEditing={editingAnalysisId === currentAnalysis.id}
        onStopEditing={onCancelEdit}
      />
    );
  }

  return (
    <EmptyState
      icon={Wand2}
      title="未找到视图"
      description='该分析视图可能已被删除。'
      className="flex-1"
      action={
        <Button variant="secondary" size="sm" onClick={onBackToTranscript}>返回转写</Button>
      }
    />
  );
};
