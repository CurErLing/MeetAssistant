
import React from 'react';
import { Mic, Upload, RefreshCw } from 'lucide-react';
import { Button } from '../../common/Button';

interface EmptyStateViewProps {
  onTriggerUpload: () => void;
  onTriggerHardwareSync: () => void;
  onStartRecording: () => void;
  isHardwareSyncing: boolean;
}

export const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  onTriggerUpload,
  onTriggerHardwareSync,
  onStartRecording,
  isHardwareSyncing
}) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[500px] text-center animate-fade-in relative px-4">
      <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-blue-100">
         <Mic size={48} />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">开始记录您的会议</h2>
      <p className="text-base sm:text-lg text-slate-500 mb-10 max-w-lg leading-relaxed">
        连接硬件设备自动同步，或直接上传音频文件。我们将为您提供精准的语音转写和智能摘要服务。
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
         <Button 
           onClick={onStartRecording} 
           size="lg" 
           className="w-full h-12 sm:h-14 text-base sm:text-lg shadow-lg shadow-blue-600/20 bg-red-600 hover:bg-red-700 whitespace-nowrap"
           icon={<Mic size={20} />}
         >
           开始录音
         </Button>
         <div className="flex w-full gap-4">
            <Button 
              variant="secondary"
              onClick={onTriggerUpload} 
              size="lg" 
              className="flex-1 h-12 sm:h-14 text-base whitespace-nowrap"
              icon={<Upload size={18} />}
            >
              导入文件
            </Button>
            <Button 
              variant="secondary"
              onClick={onTriggerHardwareSync} 
              size="lg" 
              className="flex-1 h-12 sm:h-14 text-base whitespace-nowrap"
              icon={<RefreshCw size={18} className={isHardwareSyncing ? "animate-spin" : ""} />}
              disabled={isHardwareSyncing}
            >
              {isHardwareSyncing ? '同步中...' : '同步设备'}
            </Button>
         </div>
      </div>
    </div>
  );
};
