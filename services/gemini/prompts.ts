
import { Template, TranscriptSegment, Speaker } from "../../types";

/**
 * 构建音频转写 Prompt
 */
export const buildTranscriptionPrompt = (start?: number, end?: number): string => {
  let timeInstruction = "";
  if (start !== undefined || end !== undefined) {
    const startTime = start || 0;
    const endLabel = end ? `${end}秒` : "音频结束";
    timeInstruction = `注意：请只转写从 ${startTime} 秒到 ${endLabel} 之间的音频内容。忽略该时间范围之外的所有内容。`;
  }

  return `
    请将这段会议音频转写为中文文本。
    ${timeInstruction}
    请区分不同的发言人，使用内部ID如 "spk_1", "spk_2" 等进行标识。
  `;
};

/**
 * 获取分析模板的系统指令
 */
export const getAnalysisInstruction = (template: Template | string): string => {
  // 情况 A: 用户自定义模板或高级内置模板，直接使用模板里的 prompt
  if (typeof template !== 'string' && template.prompt) {
    return template.prompt;
  }

  // 情况 B: 旧版内置模板逻辑 (硬编码 fallback)
  const tid = typeof template === 'string' ? template : template.id;
  
  switch (tid) {
    case 'action_items':
      return "请重点提取会议中的待办事项（Action Items），明确列出任务内容、提及的负责人（如果有）。格式为 Markdown 列表。同时简要总结会议背景。";
    case 'detailed':
      return "请生成一份详细的会议纪要。按时间或逻辑顺序记录讨论过程。必须保留具体是谁说了什么关键观点（使用粗体显示人名）。使用 Markdown 格式，包含层级标题。";
    case 'decisions':
      return "请忽略闲聊，只列出会议中达成的关键决策（Decisions）和共识。必须指明是谁提出或确认了这些决策。";
    case 'standard':
    default:
      return "请生成一份标准的会议摘要。包含：1. 会议主题/背景；2. 主要讨论点；3. 结论。在提到关键观点时，请务必写出是哪位发言人（使用粗体显示人名）提出的。使用 Markdown 格式（H2 标题、列表等）。";
  }
};

/**
 * 构建完整的分析 Prompt (包含上下文)
 */
export const buildAnalysisPrompt = (
  transcript: TranscriptSegment[], 
  speakers: Record<string, Speaker>,
  instruction: string
): string => {
  // 1. 将结构化的转写数据拼接成纯文本，供 AI 阅读
  const fullText = transcript.map(seg => {
    // 尝试获取真实的发言人名字，如果没有则用 ID 代替
    const name = speakers[seg.speakerId]?.name || seg.speakerId;
    return `${name}: ${seg.text}`;
  }).join('\n');

  // 2. 构建最终 Prompt
  return `
    以下是一段会议记录：
    
    ${fullText}
    
    任务指令：${instruction}
    
    要求：
    - 输出语言必须是中文。
    - 必须在总结中包含发言人的名字，不要使用 "Speaker 1" 这种代号，直接使用文本中提供的名字。
    - 使用 Markdown 格式进行排版，使其清晰易读。如果生成目录，请使用 H2, H3 等标准 Markdown 标题。
  `;
};
