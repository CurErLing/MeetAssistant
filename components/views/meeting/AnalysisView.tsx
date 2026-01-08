
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

  // 1. 处理中且无内容时：显示 Loading 界面
  if (analysis.status === 'processing' && !analysis.content) {
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

  // 3. 阅览模式 (包含流式生成中)
  return (
    <div className="flex-1 flex flex-col h-full bg-white animate-fade-in relative overflow-hidden">
      <AnalysisContent 
        content={analysis.content} 
        analysisId={analysis.id}
        isStreaming={analysis.status === 'processing'}
        header={
          <div className="mb-8 pb-4 border-b border-slate-50">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {template?.name || "分析结果"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                 {analysis.status === 'processing' ? (
                    <>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-blue-600 font-medium">AI 正在生成...</span>
                    </>
                 ) : (
                    <>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>生成完毕</span>
                    </>
                 )}
              </div>
           </div>
        }
      />
    </div>
  );
};
