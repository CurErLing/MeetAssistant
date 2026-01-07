
import { TranscriptSegment } from "../../types";

// --- 模拟数据生成器 ---
// 在没有 API Key 或网络错误时，用来生成假数据，防止应用崩溃。
export const generateMockTranscript = (endTime: number, startTime: number = 0): TranscriptSegment[] => {
  const segments: TranscriptSegment[] = [];
  let currentTime = startTime; // 从剪辑起点开始
  let idCounter = 1;
  const speakers = ['spk_1', 'spk_2', 'spk_3'];

  const dummyTexts = [
    "好的，我们可以开始这次的季度回顾会议了。",
    "我已经更新了仪表盘上的所有数据，目前指标看起来都很健康。",
    "稍等一下，我们考虑到第三季度的市场营销支出了吗？",
    "是的，上周批准的修订预算中已经包含了这一部分。",
    "太好了，那我们目前正按计划实现年度目标。",
    "我有点担心服务器成本的扩展问题，最近流量增长很快。",
    "我们可以安排在下一个冲刺周期（Sprint）进行优化。",
    "同意。那我们继续下一个议题。"
  ];

  // 循环生成直到填满 endTime 时长
  while (currentTime < endTime) {
    const segmentDuration = 2 + Math.random() * 5; // 随机生成每句话的时长
    const text = dummyTexts[Math.floor(Math.random() * dummyTexts.length)];
    const speakerId = speakers[Math.floor(Math.random() * speakers.length)];

    segments.push({
      id: `seg_${idCounter++}`,
      speakerId,
      text,
      startTime: currentTime,
      endTime: Math.min(currentTime + segmentDuration, endTime),
    });

    currentTime += segmentDuration;
    if (currentTime > endTime) break;
  }
  return segments;
};
