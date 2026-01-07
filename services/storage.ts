
import { MeetingFile, VoiceprintProfile, Hotword, Template, Folder } from '../types';

const DB_NAME = 'JimuMeetingDB';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

// --- IndexedDB: 用于存储音频文件 (Blob) ---
// LocalStorage 容量太小，不适合存音频

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveAudioBlob = async (id: string, blob: Blob): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save audio blob", error);
  }
};

export const getAudioBlob = async (id: string): Promise<Blob | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error("Failed to get audio blob", error);
    return null;
  }
};

export const deleteAudioBlob = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete audio blob", error);
  }
};

// --- LocalStorage: 用于存储元数据 (JSON) ---

const KEY_PREFIX = 'jimu_app_';

// 处理 Date 对象的序列化/反序列化
const dateReviver = (key: string, value: any) => {
  // 匹配 ISO 日期格式 (e.g., 2023-10-01T12:00:00.000Z)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
};

export const saveLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error(`Local storage save failed for ${key}`, e);
  }
};

export const loadLocal = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(KEY_PREFIX + key);
    if (!item) return defaultValue;
    return JSON.parse(item, dateReviver) as T;
  } catch (e) {
    console.error(`Local storage load failed for ${key}`, e);
    return defaultValue;
  }
};
