
import { MeetingFile } from '../types';

export const MOCK_LOCAL_MEETINGS: MeetingFile[] = [
  {
    id: 'mock_local_1',
    name: '产品需求评审 - 移动端 V2.1',
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5小时前
    lastAccessedAt: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前访问
    duration: 3600,
    status: 'ready',
    format: 'wav',
    speakers: {},
    file: null, url: '', trimStart: 0, trimEnd: 0,
    isReadOnly: false
  },
  {
    id: 'mock_local_2',
    name: 'Marketing 创意脑暴会',
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前
    lastAccessedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前访问
    duration: 2400,
    status: 'ready',
    format: 'mp3',
    speakers: {},
    file: null, url: '', trimStart: 0, trimEnd: 0,
    isReadOnly: false
  },
  {
    id: 'mock_local_3',
    name: 'Q4 销售启动大会',
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2天前
    lastAccessedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前访问
    duration: 7200,
    status: 'ready',
    format: 'mp3',
    speakers: {},
    file: null, url: '', trimStart: 0, trimEnd: 0,
    isReadOnly: false
  }
];
