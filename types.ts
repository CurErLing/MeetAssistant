
/**
 * 发言人身份状态枚举
 * 用于区分系统识别的发言人和已在声纹库注册的真实用户
 */
export enum SpeakerStatus {
  UNKNOWN = 'UNKNOWN',       // 未知状态
  IDENTIFIED = 'IDENTIFIED', // 系统自动识别出的发言人（如 Speaker 1）
  REGISTERED = 'REGISTERED'  // 已关联声纹库的实名用户
}

/**
 * 发言人对象结构
 */
export interface Speaker {
  id: string; // 唯一标识符，e.g., "spk_1"
  defaultLabel: string; // 默认显示标签，e.g., "Speaker 1"
  name: string; // 用户编辑后的显示名称
  status: SpeakerStatus; // 当前身份状态
  color: string; // 用于 UI 显示的头像/文字颜色类名
}

/**
 * 转写片段结构
 * 代表音频中的一句话或一个时间段的文本
 */
export interface TranscriptSegment {
  id: string;
  speakerId: string; // 关联到 Speaker 对象的 ID
  text: string; // 转写文本内容
  startTime: number; // 开始时间 (秒)
  endTime: number; // 结束时间 (秒)
  isEditing?: boolean; // 前端 UI 状态：是否处于编辑模式
}

/**
 * AI 分析结果结构
 * 用于存储基于模板生成的总结、摘要或洞察
 */
export interface AnalysisResult {
  id: string; // 分析结果唯一 ID
  templateId: string; // 使用的模板 ID
  content: string; // 生成的 Markdown 内容
  status: 'processing' | 'ready' | 'error'; // 生成状态
}

/**
 * 文件夹结构
 * 用于组织会议文件
 */
export interface Folder {
  id: string;
  name: string;
  meetingIds: string[]; // 包含的会议 ID 列表
}

/**
 * 核心会议文件对象
 * 包含录音文件的所有元数据、转写内容和分析结果
 */
export interface MeetingFile {
  id: string;
  name: string; // 会议标题
  
  // File 对象不存储在 LocalStorage，仅在运行时存在或从 IndexedDB 恢复
  file: File | null; 
  
  // 用于音频播放的 Blob URL (生命周期仅限于当前页面会话)
  url: string; 
  
  duration: number; // 音频总时长 (秒)
  format: 'wav' | 'mp3';
  uploadDate: Date;
  lastAccessedAt?: Date; // 最后访问时间，用于“最近访问”排序
  status: 'uploading' | 'processing' | 'ready' | 'error'; // 处理状态机
  
  transcript?: TranscriptSegment[]; // 转写结果数组
  speakers: Record<string, Speaker>; // 发言人字典 map
  
  // 音频剪辑范围 (不实际裁剪文件，仅影响播放和上传)
  trimStart: number; 
  trimEnd: number;
  
  // 旧版摘要字段 (保留兼容性)
  summary?: string; 
  summaryTemplate?: string;
  
  // 新版多视角分析结果
  analyses?: AnalysisResult[]; 
  
  // 回收站功能：删除时间
  deletedAt?: Date; 
  
  // 归属文件夹 ID
  folderId?: string;

  // 权限控制：是否为只读（共享给我的文件）
  isReadOnly?: boolean;

  // 是否收藏
  isStarred?: boolean;

  // 搜索结果匹配片段 (临时字段，仅在搜索时存在)
  matchSnippet?: string;
}

/**
 * 声纹档案
 * 存储已注册的用户声纹元数据
 */
export interface VoiceprintProfile {
  id: string;
  name: string;
  createdAt: Date;
}

/**
 * 热词对象
 * 用于提升特定词汇的识别准确率
 */
export interface Hotword {
  id: string;
  word: string; // 具体的词汇
  category: string; // 分类 (如：人名、公司名)
  createdAt: Date;
}

/**
 * AI 分析模板
 * 定义了 AI 如何处理会议内容的指令
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string; // 模板分类 (通用/会议/面试等)
  tags: string[];
  icon: string; // Lucide 图标名称
  prompt?: string; // 发送给 LLM 的自定义系统指令 (System Prompt)
  usageCount?: number; // 使用热度
  isCustom?: boolean; // 是否为自定义
  author?: string; // 创建者名称
  isStarred?: boolean;      // 是否已收藏
  isUserCreated?: boolean;  // 是否为用户自建
}

/**
 * 分享配置
 * 控制分享页面显示的内容
 */
export interface ShareConfig {
  shareAudio: boolean;
  shareTranscript: boolean;
  selectedAnalyses: string[];
}

/**
 * 全局视图状态类型
 */
export type ViewState = 'home' | 'list' | 'detail' | 'voiceprints' | 'hotwords' | 'external-share' | 'templates' | 'recycle-bin' | 'profile';
