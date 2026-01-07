
import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const AnalysisProcessingState = ({ templateName }: { templateName?: string }) => (
  <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8 animate-fade-in bg-slate-50/30 min-h-[400px]">
    <div className="relative mb-8">
       {/* Pulse Effect */}
       <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20 scale-150"></div>
       
       {/* Icon Container */}
       <div className="w-20 h-20 bg-white border border-slate-200 shadow-xl rounded-2xl flex items-center justify-center relative z-10">
          <Loader2 size={36} className="text-blue-600 animate-spin" strokeWidth={2.5} />
          {/* Badge */}
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-1.5 text-white border-4 border-slate-50 shadow-sm">
             <Sparkles size={12} fill="currentColor" />
          </div>
       </div>
    </div>
    
    <div className="text-center max-w-md space-y-3">
      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
        正在生成{templateName ? `【${templateName}】` : '分析结果'}...
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed">
        AI 正在深度阅读会议转写内容，提取关键信息并进行结构化整理。
        <br/>根据会议时长，这可能需要 10-30 秒。
      </p>
    </div>
    
    {/* Progress Bar Visual */}
    <div className="w-64 h-1.5 bg-slate-200 rounded-full mt-8 overflow-hidden">
       <div className="h-full bg-blue-500 rounded-full animate-[loading_2s_ease-in-out_infinite] w-1/3 origin-left"></div>
    </div>
    
    <style>{`
      @keyframes loading {
        0% { transform: translateX(-100%); width: 20%; }
        50% { width: 50%; }
        100% { transform: translateX(300%); width: 20%; }
      }
    `}</style>
  </div>
);
