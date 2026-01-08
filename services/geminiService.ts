
import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptSegment, Speaker, Template } from "../types";
import { fileToBase64 } from "../utils/fileUtils";
import { generateMockTranscript } from "./gemini/mockData";
import { buildTranscriptionPrompt, getAnalysisInstruction, buildAnalysisPrompt } from "./gemini/prompts";

// 重新导出 generateMockTranscript 以保持兼容性或用于其他模块
export { generateMockTranscript };

// 指定使用的模型版本
const MODEL_ID = 'gemini-3-flash-preview';
// 使用支持搜索的模型进行 URL 解析
const SEARCH_MODEL_ID = 'gemini-3-pro-preview';

// --- Client Helper ---
// 安全获取 Gemini 客户端实例，如果未配置 Key 则返回 null
const getGeminiClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

interface TranscribeOptions {
  start?: number;
  end?: number;
}

/**
 * 核心功能 1：音频转写 (Audio Transcription)
 * 流程：
 * 1. 将 File 对象转换为 Base64。
 * 2. 构建 Prompt 指令。
 * 3. 调用 Gemini `generateContent` 接口，并配置 `responseSchema` 强制返回 JSON 数组格式。
 * 4. 解析 JSON 并转换为内部 TranscriptSegment 结构。
 */
export const transcribeAudio = async (file: File | null, options?: TranscribeOptions): Promise<TranscriptSegment[]> => {
  // 1. 检查 API Key 及文件
  const ai = getGeminiClient();
  if (!ai || !file) {
    // 既然要求不使用假数据，这里直接抛出错误，以便 UI 显示失败状态并允许重试
    throw new Error("未配置 Google Gemini API Key 或文件为空");
  }

  try {
    // 2. 准备数据：Audio -> Base64
    const base64Audio = await fileToBase64(file);
    const prompt = buildTranscriptionPrompt(options?.start, options?.end);

    // 3. 调用 API
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: {
        // 多模态输入：同时发送音频数据和文本指令
        parts: [{ inlineData: { mimeType: file.type, data: base64Audio } }, { text: prompt }]
      },
      config: { 
        responseMimeType: "application/json", 
        // 结构化输出配置：强制模型返回包含 speakerId, text, startTime, endTime 的对象数组
        responseSchema: {
          type: Type.ARRAY, 
          items: {
            type: Type.OBJECT, 
            properties: {
              speakerId: { type: Type.STRING, description: "发言人ID" },
              text: { type: Type.STRING, description: "转录文本" },
              startTime: { type: Type.NUMBER, description: "开始时间(秒)" },
              endTime: { type: Type.NUMBER, description: "结束时间(秒)" },
            },
            required: ["speakerId", "text", "startTime", "endTime"] 
          }
        }
      }
    });

    // 4. 处理结果
    const resultText = response.text || "[]";
    const rawSegments = JSON.parse(resultText);

    // 转换为前端使用的格式 (添加唯一 ID)
    return rawSegments.map((s: any, index: number) => ({
      id: `seg_${Date.now()}_${index}`,
      speakerId: s.speakerId || 'spk_1',
      text: s.text,
      startTime: s.startTime || 0,
      endTime: s.endTime || 0
    }));
  } catch (error) {
    console.error("Transcription error:", error);
    // 抛出错误，以便上层应用处理为 Error 状态
    throw error;
  }
};

/**
 * 核心功能 2：生成会议总结/分析 (AI Analysis)
 * 流程：
 * 1. 结合转写文本和用户选择的模板指令构建长文本 Prompt。
 * 2. 将发言人 ID 替换为真实姓名（如果有），提供上下文。
 * 3. 请求 Gemini 生成 Markdown 格式的分析报告 (支持流式输出)。
 */
export const generateMeetingSummary = async (
  transcript: TranscriptSegment[], 
  speakers: Record<string, Speaker>,
  template: Template | string,
  onProgress?: (text: string) => void
): Promise<string> => {
  // 1. 检查 API Key
  const ai = getGeminiClient();
  if (!ai) {
    return "API Key 未配置，无法生成分析。";
  }

  try {
    // 2. 构建 Prompt (包含转写全文 + 发言人映射 + 模板指令)
    const instruction = getAnalysisInstruction(template);
    const prompt = buildAnalysisPrompt(transcript, speakers, instruction);

    // 3. 调用 API (Stream Mode)
    const streamResult = await ai.models.generateContentStream({
      model: MODEL_ID,
      contents: prompt,
    });

    let fullText = "";
    for await (const chunk of streamResult) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        if (onProgress) {
          onProgress(fullText);
        }
      }
    }

    return fullText || "生成总结失败。";
  } catch (error) {
    console.error("Summary generation error:", error);
    return "生成总结时发生错误，请重试。错误信息：" + error;
  }
};

/**
 * 核心功能 3：解析外部内容模版 (Parse External Templates)
 * 支持两种模式：
 * A. 输入 URL：使用 Google Search Grounding 尝试访问页面（仅限公开索引页面）。
 * B. 输入文本/CSV：直接解析用户粘贴的内容（适用于飞书/Lark 等权限受限的页面，用户可直接复制内容粘贴）。
 */
export const parseExternalTemplates = async (input: string): Promise<Template[]> => {
  const ai = getGeminiClient();
  if (!ai) throw new Error("API Key missing");

  // 简单的 URL 检测
  const isUrl = /^(http|https):\/\/[^ "]+$/.test(input.trim());

  let prompt = "";
  let tools: any[] = [];

  if (isUrl) {
    prompt = `
      Please visit the following URL and analyze its content to extract "Meeting Analysis Templates" or similar structured data.
      URL: ${input}

      This is likely a document containing template definitions.
      Look for text that represents:
      - Template Name
      - Prompt / Instruction (The system prompt for AI)
      - Description
      - Category (e.g., Meeting, Interview, General)
      - Icon Name (Infer a suitable Lucide icon name like 'FileText', 'Zap', 'Users', 'Star' based on content)

      Return a JSON array of template objects.
    `;
    tools = [{ googleSearch: {} }];
  } else {
    // 文本/内容粘贴模式
    prompt = `
      Analyze the following text content, which is copied from a spreadsheet or document (e.g., Feishu/Lark Base).
      Extract structured "Meeting Analysis Templates" from it.
      
      Raw Content:
      """
      ${input.substring(0, 10000)} 
      """

      Task: Identify rows or sections that define a template. 
      For each template found, extract:
      - name: The title of the template.
      - prompt: The detailed AI instruction/prompt.
      - description: A brief summary (if available, otherwise infer from name).
      - category: A category (infer if not explicit, e.g., 'Meeting', 'General').
      - icon: Infer a suitable Lucide icon name string.
      
      Return a JSON array.
    `;
    // No tools needed for text processing
  }

  try {
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL_ID,
      contents: prompt,
      config: {
        tools: tools.length > 0 ? tools : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              prompt: { type: Type.STRING },
              icon: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "prompt"]
          }
        }
      }
    });

    const resultText = response.text || "[]";
    const rawTemplates = JSON.parse(resultText);

    // Enhance with local IDs and defaults
    return rawTemplates.map((t: any, idx: number) => ({
      id: `tpl_ext_${Date.now()}_${idx}`,
      name: t.name || "未命名模版",
      description: t.description || "从外部导入的模版",
      category: t.category || "通用",
      tags: t.tags || ["导入"],
      icon: t.icon || "FileText",
      prompt: t.prompt || "无指令",
      usageCount: 0,
      isCustom: true,
      author: isUrl ? "链接解析" : "文本粘贴",
      isStarred: false,
      isUserCreated: true
    }));

  } catch (error) {
    console.error("External parse error:", error);
    throw new Error("解析失败。如果是私有文档（如飞书文档），请尝试直接复制表格内容并粘贴到输入框中。");
  }
};
