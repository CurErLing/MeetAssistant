import React from 'react';
import { AnalysisResult, Template } from '../../../types';
import { AnalysisProcessingState } from './analysis/AnalysisProcessingState';
import { AnalysisEditor } from './analysis/AnalysisEditor';
import { AnalysisContent } from './analysis/AnalysisContent';

interface AnalysisViewProps {
  analysis: AnalysisResult;
  template?: Template;
  onUpdate: (updates: Partial<AnalysisResult>) => void;
  isEditing: boolean;
  onStopEditing: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  analysis,
  template,
  onUpdate,
  isEditing,
  onStopEditing
}) => {
  const handleSave = (content: string) => {
    onUpdate({ content });
    onStopEditing();
  };

  // 1. 处理中状态
  if (analysis.status === 'processing') {
    return <AnalysisProcessingState templateName={template?.name} />;
  }

  // 2. 编辑模式
  if (isEditing) {
    return (
      <AnalysisEditor 
        initialContent={analysis.content} 
        onSave={handleSave} 
        onCancel={onStopEditing} 
      />
    );
  }

  // 3. 阅览模式
  return (
    <div className="flex-1 flex flex-col h-full bg-white animate-fade-in relative overflow-hidden">
      <AnalysisContent 
        content={analysis.content} 
        analysisId={analysis.id}
        header={undefined}
      />
    </div>
  );
};
