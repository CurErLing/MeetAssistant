
/**
 * 将秒数格式化为 MM:SS 字符串
 * @param seconds 秒数
 * @returns 格式化后的字符串 (例如 "05:30")
 */
export const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
