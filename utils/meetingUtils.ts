
import { MeetingFile } from '../types';

/**
 * 获取会议所有者名称
 * 如果是只读文件（共享给我的），则基于 ID 生成模拟的共享者姓名
 */
export const getOwnerName = (meeting: MeetingFile) => {
  if (!meeting.isReadOnly) return '我';
  
  // 简单的哈希算法，保证同一个 ID 总是返回相同的模拟名字
  const hash = meeting.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const owners = ['雷军', '张小龙', 'Tim Cook', '产品总监', 'CTO', '王兴'];
  return owners[hash % owners.length];
};
