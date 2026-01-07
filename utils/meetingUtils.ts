
import { MeetingFile, Folder } from '../types';

export const getOwnerName = (meeting: MeetingFile) => {
  if (!meeting.isReadOnly) return '我';
  const hash = meeting.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const owners = ['雷军', '张小龙', 'Tim Cook', '产品总监', 'CTO', '王兴'];
  return owners[hash % owners.length];
};

export const getFolderInfo = (folders: Folder[], folderId?: string) => {
  const folder = folders.find(f => f.id === folderId);
  return {
    name: folder ? folder.name : '未分类',
    isUncategorized: !folder
  };
};
