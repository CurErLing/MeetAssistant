
import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptSegment, Speaker, Template } from "../types";
import { fileToBase64 } from "../utils/fileUtils";
import { generateMockTranscript } from "./gemini/mockData";
import { buildTranscriptionPrompt, getAnalysisInstruction, buildAnalysisPrompt } from "./gemini/prompts";

// 重新导出 generateMockTranscript 以保持兼容性或用于其他模块
export { generateMockTranscript };

const MODEL_ID = 'gemini-3-flash-preview';

// --- Client Helper ---
const getGeminiClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

interface TranscribeOptions {
  start?: number;
  end?: number;
}

/**
 * 核心功能：音频转写 (Audio Transcription)
 */
export const transcribeAudio = async (file: File | null, options?: TranscribeOptions): Promise<TranscriptSegment[]> => {
  // 1. 检查 API Key
  const ai = getGeminiClient();
  if (!ai || !file) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟延迟
    return generateMockTranscript(options?.end || 30, options?.start || 0);
  }

  try {
    // 2. 准备数据
    const base64Audio = await fileToBase64(file);
    const prompt = buildTranscriptionPrompt(options?.start, options?.end);

    // 3. 调用 API
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: {
        parts: [{ inlineData: { mimeType: file.type, data: base64Audio } }, { text: prompt }]
      },
      config: { 
        responseMimeType: "application/json", 
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

    return rawSegments.map((s: any, index: number) => ({
      id: `seg_${Date.now()}_${index}`,
      speakerId: s.speakerId || 'spk_1',
      text: s.text,
      startTime: s.startTime || 0,
      endTime: s.endTime || 0
    }));
  } catch (error) {
    console.error("Transcription error:", error);
    // 错误降级处理
    return generateMockTranscript(options?.end || 30, options?.start || 0); 
  }
};

/**
 * 核心功能：生成会议总结/分析 (AI Analysis)
 */
export const generateMeetingSummary = async (
  transcript: TranscriptSegment[], 
  speakers: Record<string, Speaker>,
  template: Template | string 
): Promise<string> => {
  // 1. 检查 API Key
  const ai = getGeminiClient();
  if (!ai) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `# 模拟会议总结\n\n**模拟摘要内容...**\n\n这是一段由于未配置 API Key 而显示的模拟文本。请在 .env 文件中配置您的 Google Gemini API Key 以获得真实分析结果。`;
  }

  try {
    // 2. 构建 Prompt
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
