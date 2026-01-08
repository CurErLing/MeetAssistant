
import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptSegment, Speaker, Template } from "../types";
import { fileToBase64 } from "../utils/fileUtils";
import { generateMockTranscript } from "./gemini/mockData";
import { buildTranscriptionPrompt, getAnalysisInstruction, buildAnalysisPrompt } from "./gemini/prompts";

// 重新导出 generateMockTranscript 以保持兼容性或用于其他模块
export { generateMockTranscript };

// 指定使用的模型版本
const MODEL_ID = 'gemini-3-flash-preview';

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
 * 3. 请求 Gemini 生成 Markdown 格式的分析报告。
 */
export const generateMeetingSummary = async (
  transcript: TranscriptSegment[], 
  speakers: Record<string, Speaker>,
  template: Template | string 
): Promise<string> => {
  // 1. 检查 API Key
  const ai = getGeminiClient();
  if (!ai) {
    // 对于分析功能，如果没有 Key，也应当提示而不是给假数据，保持一致性
    return "API Key 未配置，无法生成分析。";
  }

  try {
    // 2. 构建 Prompt (包含转写全文 + 发言人映射 + 模板指令)
    const instruction = getAnalysisInstruction(template);
    const prompt = buildAnalysisPrompt(transcript, speakers, instruction);

    // 3. 调用 API
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
    });

    return response.text || "生成总结失败。";
  } catch (error) {
    console.error("Summary generation error:", error);
    return "生成总结时发生错误，请重试。错误信息：" + error;
  }
};
