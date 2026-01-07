
import { MeetingFile } from '../types';

export const MOCK_SHARED_MEETINGS: MeetingFile[] = [
  {
    id: 'mock_shared_1',
    name: '2025年度战略规划初稿讨论',
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 2),
    duration: 5400,
    status: 'ready',
    format: 'wav',
    speakers: {},
    file: null, url: '', trimStart: 0, trimEnd: 0,
    isReadOnly: true
  },
  {
    id: 'mock_shared_2',
    name: '产品体验走查 - V3.0',
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    duration: 3200,
    status: 'ready',
    format: 'mp3',
    speakers: {},
    file: null, url: '', trimStart: 0, trimEnd: 0,
    isReadOnly: true
  },
  {
    id: 'mock_shared_3',
    name: 'Q3 财报电话会议录音',
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
    duration: 7200,
    status: 'ready',
    format: 'mp3',
    speakers: {},
    file: null, url: '', trimStart: 0, trimEnd: 0,
    isReadOnly: true
  },
  {
    id: 'mock_shared_4',
    name: '用户深度访谈 - Z世代群体',
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    duration: 1800,
    status: 'ready',
    format: 'wav',
    speakers: {},
    file: null, url: '', trimStart: 0, trimEnd: 0,
    isReadOnly: true
  },
  {
    id: 'mock_shared_5',
    name: '技术架构评审委员会',
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    duration: 4500,
    status: 'ready',
    format: 'wav',
    speakers: {},
    file: null, url: '', trimStart: 0, trimEnd: 0,
    isReadOnly: true
  }
];
