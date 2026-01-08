
import React from 'react';
import { Edit2, Copy } from 'lucide-react';
import { TranscriptSegment, Speaker } from '../../../types';
import { Button } from '../../common/Button';
import { formatTime } from '../../../utils/formatUtils';

interface TranscriptItemProps {
  segment: TranscriptSegment;
  speaker: Speaker | undefined; // 注意：这里允许 speaker 为 undefined，因为数据可能尚未加载完全或同步延迟
  isActive: boolean;            // 当前播放时间是否对应此片段
  isEditing?: boolean;          // 是否处于编辑模式
  inputValue?: string;
  readOnly?: boolean;
  onSpeakerClick?: (id: string) => void;
  onSeek: (time: number) => void;
  onEditClick?: (seg: TranscriptSegment) => void;
  onCopy?: (text: string) => void;
  onInputChange?: (val: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
}

/**
 * 单条转写记录组件
 * 负责渲染：时间戳、发言人信息、文本内容、编辑状态
 */
export const TranscriptItem: React.FC<TranscriptItemProps> = React.memo(({
  segment, speaker, isActive, isEditing = false, inputValue = "", readOnly = false,
  onSpeakerClick, onSeek, onEditClick, onCopy, onInputChange, onSave, onCancel
}) => {
  // --- 防御性编程 ---
  // 使用可选链 (?.) 和逻辑或 (||) 处理 speaker 可能为空的情况
  // 即使 speaker 数据丢失，也能显示默认颜色和“未知”名称，防止页面崩溃
  const speakerColor = speaker?.color ? speaker.color.split(' ')[0] : 'text-slate-700';
  const speakerName = speaker?.name || "未知";
  const speakerId = speaker?.id;

  return (
    <div 
      // 设置 ID 用于自动滚动定位
      id={readOnly ? `segment-readonly-${segment.id}` : `segment-${segment.id}`} 
      className={`flex flex-col sm:flex-row gap-2 sm:gap-4 group/row py-3 sm:py-4 px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl sm:rounded-2xl transition-all ${isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}
    >
      {/* 左侧：发言人信息与时间戳 */}
      <div className="flex-shrink-0 w-full sm:w-24 flex sm:block items-center justify-between sm:justify-start">
         {/* 如果是只读，或者没有点击事件，或者 speakerId 缺失，则渲染纯文本 */}
         {readOnly || !onSpeakerClick || !speakerId ? (
            <div className={`text-xs font-bold sm:mb-1 block truncate ${speakerColor}`}>
              {speakerName}
            </div>
         ) : (
            // 否则渲染为可点击按钮，用于修改发言人姓名或关联声纹
            <button 
              onClick={(e) => { e.stopPropagation(); onSpeakerClick(speakerId); }}
              className={`text-xs font-bold sm:mb-1 block hover:underline text-left truncate ${speakerColor}`}
            >
              {speakerName}
            </button>
         )}
         <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-100 sm:bg-transparent px-1.5 py-0.5 rounded sm:px-0 sm:py-0">
           {formatTime(segment.startTime)}
         </div>
      </div>
      
      {/* 右侧：文本内容 */}
      <div className="flex-1 min-w-0">
        {isEditing && !readOnly ? (
          // --- 编辑模式视图 ---
          <div className="space-y-2">
            <textarea 
              className="w-full p-3 sm:p-4 text-sm border border-blue-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-50 focus:outline-none bg-white shadow-inner leading-relaxed"
              rows={3}
              value={inputValue}
              onChange={(e) => onInputChange && onInputChange(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={onCancel}>取消</Button>
              <Button size="sm" onClick={onSave}>保存</Button>
            </div>
          </div>
        ) : (
          // --- 阅读模式视图 ---
          <div 
            className="flex items-start gap-2 cursor-pointer relative"
            onClick={() => onSeek(segment.startTime)} // 点击文字跳转音频进度
            title="点击跳转到此音频位置"
          >
            <p className={`leading-relaxed text-sm sm:text-base flex-1 transition-colors pr-8 sm:pr-0 ${isActive ? 'text-slate-900 font-medium' : 'text-slate-700 hover:text-blue-600'}`}>
              {segment.text}
            </p>
            
            {/* 悬浮操作按钮 (仅在 hover 时显示) */}
            {!readOnly && (
              <div className="absolute right-0 top-0 sm:relative flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/row:opacity-100 transition-all flex-shrink-0 bg-white/80 sm:bg-transparent rounded backdrop-blur-sm sm:backdrop-blur-none p-1 sm:p-0 border border-slate-100 sm:border-none shadow-sm sm:shadow-none">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditClick && onEditClick(segment); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="修改"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onCopy && onCopy(segment.text); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="复制"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
