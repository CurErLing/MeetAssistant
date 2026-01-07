
import React, { useState, useEffect } from 'react';
import { 
  Share2, Eye, Mic, FileText, Sparkles, CheckCircle2, Circle, ArrowRight, Globe, Link as LinkIcon, Copy, Check, X 
} from 'lucide-react';
import { Button } from '../../common/Button';
import { BaseModal } from '../BaseModal';
import { MeetingFile, Template, ShareConfig } from '../../../types';

export const ShareModal = ({
  meeting,
  templates = [],
  onClose,
  onPreview
}: {
  meeting: MeetingFile,
  templates?: Template[],
  onClose: () => void,
  onPreview: (config: ShareConfig) => void
}) => {
  const [step, setStep] = useState<'select' | 'result'>('select');
  const [isCopied, setIsCopied] = useState(false);
  
  // Selection States
  const [shareAudio, setShareAudio] = useState(true);
  const [shareTranscript, setShareTranscript] = useState(true);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);

  const shareUrl = `https://jimumeeting.ai/share/${meeting.id}?t=${Date.now()}`;

  // Initialize selectedAnalyses with all available analyses by default
  useEffect(() => {
    if (meeting.analyses) {
      setSelectedAnalyses(meeting.analyses.map(a => a.id));
    }
  }, [meeting.analyses]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateLink = () => {
    setStep('result');
  };

  const toggleAnalysis = (id: string) => {
    setSelectedAnalyses(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const availableAnalyses = meeting.analyses || [];

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title={
        <>
          <Share2 size={20} className="text-blue-600" />
          <span>分享会议</span>
        </>
      }
      footer={
        step === 'select' ? (
          <>
            <Button onClick={onClose} variant="secondary" className="flex-1">取消</Button>
            <Button onClick={handleGenerateLink} className="flex-1" icon={<ArrowRight size={16}/>}>生成公开链接</Button>
          </>
        ) : (
          <>
             <Button 
               variant="secondary" 
               className="flex-1" 
               onClick={() => onPreview({ shareAudio, shareTranscript, selectedAnalyses })}
               icon={<Eye size={16}/>}
             >
               预览
             </Button>
             <Button onClick={onClose} className="flex-1">完成</Button>
          </>
        )
      }
    >
      {step === 'select' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h4 className="text-sm font-bold text-slate-700">请勾选对外公开的内容</h4>
             <button 
                onClick={() => onPreview({ shareAudio, shareTranscript, selectedAnalyses })} 
                className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
             >
               <Eye size={12} /> 预览效果
             </button>
          </div>
          
          <div className="space-y-3">
            {/* 1. Audio */}
            <div 
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${shareAudio ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              onClick={() => setShareAudio(!shareAudio)}
            >
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${shareAudio ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Mic size={18} />
                 </div>
                 <div>
                    <div className={`text-sm font-bold ${shareAudio ? 'text-slate-900' : 'text-slate-500'}`}>原始录音</div>
                    <div className="text-xs text-slate-400">包含完整的音频播放功能</div>
                 </div>
              </div>
              {shareAudio ? <CheckCircle2 size={20} className="text-blue-600" fill="currentColor" color="white" /> : <Circle size={20} className="text-slate-300" />}
            </div>

            {/* 2. Transcript */}
            <div 
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${shareTranscript ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              onClick={() => setShareTranscript(!shareTranscript)}
            >
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${shareTranscript ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    <FileText size={18} />
                 </div>
                 <div>
                    <div className={`text-sm font-bold ${shareTranscript ? 'text-slate-900' : 'text-slate-500'}`}>转写逐字稿</div>
                    <div className="text-xs text-slate-400">包含发言人识别和文本内容</div>
                 </div>
              </div>
              {shareTranscript ? <CheckCircle2 size={20} className="text-blue-600" fill="currentColor" color="white" /> : <Circle size={20} className="text-slate-300" />}
            </div>

            {/* 3. Analyses (Dynamic) */}
            {availableAnalyses.length > 0 && (
               <div className="mt-4 pt-4 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI 分析结果</h5>
                  <div className="space-y-2">
                    {availableAnalyses.map(analysis => {
                       // Find template name
                       const template = templates.find(t => t.id === analysis.templateId);
                       const isSelected = selectedAnalyses.includes(analysis.id);
                       const tName = template ? template.name : "未知分析";

                       return (
                          <div 
                            key={analysis.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            onClick={() => toggleAnalysis(analysis.id)}
                          >
                            <div className="flex items-center gap-3">
                               <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                  <Sparkles size={18} />
                               </div>
                               <div className="text-sm font-bold text-slate-900">{tName}</div>
                            </div>
                            {isSelected ? <CheckCircle2 size={20} className="text-indigo-600" fill="currentColor" color="white" /> : <Circle size={20} className="text-slate-300" />}
                          </div>
                       );
                    })}
                  </div>
               </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 text-center py-4">
           <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce-subtle">
              <Globe size={32} />
           </div>
           <div>
              <h4 className="text-xl font-bold text-slate-900 mb-1">链接已生成</h4>
              <p className="text-sm text-slate-500">获得链接的人可以访问您勾选的内容</p>
           </div>
           
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center">
              <div className="h-10 w-10 flex items-center justify-center text-slate-400 bg-white border border-slate-100 rounded-lg shadow-sm">
                 <LinkIcon size={16} />
              </div>
              <input readOnly className="flex-1 bg-transparent px-3 text-sm text-slate-600 outline-none" value={shareUrl} />
              <Button size="sm" onClick={copyLink} icon={isCopied ? <Check size={14} /> : <Copy size={14} />} className={isCopied ? "bg-green-600 hover:bg-green-700" : ""}>
                 {isCopied ? '已复制' : '复制'}
              </Button>
           </div>

           <div className="flex gap-2 justify-center">
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${shareAudio ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                 {shareAudio ? <Check size={10} className="mr-1"/> : <X size={10} className="mr-1"/>} 录音
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${shareTranscript ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                 {shareTranscript ? <Check size={10} className="mr-1"/> : <X size={10} className="mr-1"/>} 逐字稿
              </span>
              {selectedAnalyses.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-medium">
                   <Check size={10} className="mr-1"/> {selectedAnalyses.length} 个分析
                </span>
              )}
           </div>
        </div>
      )}
    </BaseModal>
  );
};
