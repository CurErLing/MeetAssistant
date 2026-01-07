import { supabase } from './supabaseClient';
import { MeetingFile, Folder, VoiceprintProfile, Hotword, Template, TranscriptSegment, Speaker, AnalysisResult } from '../types';

// --- Data Mapping Helpers ---
// Map Supabase snake_case to App camelCase

const mapMeetingFromDB = (row: any): MeetingFile => ({
  id: row.id,
  name: row.name,
  file: null, // File objects are not stored in DB, audio is loaded via URL
  url: row.audio_url ? supabase.storage.from('meeting-recordings').getPublicUrl(row.audio_url).data.publicUrl : '',
  duration: row.duration || 0,
  format: row.format as 'mp3' | 'wav',
  uploadDate: new Date(row.created_at),
  lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : new Date(row.created_at),
  status: row.status as any,
  transcript: row.transcript || [],
  speakers: row.speakers || {},
  trimStart: 0,
  trimEnd: 0,
  analyses: row.analyses || [],
  deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
  folderId: row.folder_id || undefined,
  isReadOnly: row.is_read_only || false,
  isStarred: row.is_starred || false,
});

const mapFolderFromDB = (row: any): Folder => ({
  id: row.id,
  name: row.name,
  meetingIds: [] // Will be populated by joining or filtering meetings
});

const mapTemplateFromDB = (row: any): Template => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  tags: row.tags || [],
  icon: row.icon,
  prompt: row.prompt,
  usageCount: row.usage_count || 0,
  isCustom: row.is_custom,
  author: row.author,
  isStarred: row.is_starred,
  isUserCreated: row.is_user_created
});

const mapVoiceprintFromDB = (row: any): VoiceprintProfile => ({
  id: row.id,
  name: row.name,
  createdAt: new Date(row.created_at)
});

const mapHotwordFromDB = (row: any): Hotword => ({
  id: row.id,
  word: row.word,
  category: row.category,
  createdAt: new Date(row.created_at)
});

// --- Service Methods ---

export const supabaseService = {
  // --- Meetings ---
  async fetchMeetings(): Promise<{ active: MeetingFile[], deleted: MeetingFile[] }> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meetings:', JSON.stringify(error, null, 2));
      return { active: [], deleted: [] };
    }

    const meetings = data.map(mapMeetingFromDB);
    return {
      active: meetings.filter(m => !m.deletedAt),
      deleted: meetings.filter(m => !!m.deletedAt)
    };
  },

  async uploadAudio(file: Blob, path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('meeting-recordings')
      .upload(path, file, { upsert: true });

    if (error) {
      console.error('Error uploading audio:', JSON.stringify(error, null, 2));
      return null;
    }
    return data.path;
  },

  async createMeeting(meeting: MeetingFile, audioBlob: Blob) {
    const audioPath = `${meeting.id}.${meeting.format}`;
    const uploadedPath = await this.uploadAudio(audioBlob, audioPath);

    if (!uploadedPath) throw new Error("Audio upload failed");

    const row = {
      id: meeting.id,
      name: meeting.name,
      duration: Math.round(meeting.duration || 0), // Ensure integer for DB
      format: meeting.format,
      created_at: meeting.uploadDate.toISOString(),
      last_accessed_at: meeting.lastAccessedAt ? meeting.lastAccessedAt.toISOString() : new Date().toISOString(),
      status: meeting.status,
      transcript: meeting.transcript || [],
      speakers: meeting.speakers || {},
      analyses: meeting.analyses || [],
      folder_id: meeting.folderId || null,
      is_starred: meeting.isStarred || false,
      is_read_only: meeting.isReadOnly || false,
      audio_url: uploadedPath,
      deleted_at: null
    };

    const { error } = await supabase.from('meetings').insert(row);
    if (error) {
      console.error('Error creating meeting:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  async updateMeeting(id: string, updates: Partial<MeetingFile>) {
    // Map partial updates to DB columns
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;
    if (updates.isStarred !== undefined) dbUpdates.is_starred = updates.isStarred;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.lastAccessedAt !== undefined) dbUpdates.last_accessed_at = updates.lastAccessedAt.toISOString();
    if (updates.transcript !== undefined) dbUpdates.transcript = updates.transcript;
    if (updates.speakers !== undefined) dbUpdates.speakers = updates.speakers;
    if (updates.analyses !== undefined) dbUpdates.analyses = updates.analyses;
    if (updates.deletedAt !== undefined) dbUpdates.deleted_at = updates.deletedAt ? updates.deletedAt.toISOString() : null;

    const { error } = await supabase.from('meetings').update(dbUpdates).eq('id', id);
    if (error) console.error('Error updating meeting:', JSON.stringify(error, null, 2));
  },

  async deleteMeetingPermanent(id: string, format: string) {
    // Delete from DB
    await supabase.from('meetings').delete().eq('id', id);
    // Delete from Storage
    await supabase.storage.from('meeting-recordings').remove([`${id}.${format}`]);
  },

  // --- Folders ---
  async fetchFolders(): Promise<Folder[]> {
    const { data, error } = await supabase.from('folders').select('*');
    if (error) {
      console.error('Error fetching folders:', JSON.stringify(error, null, 2));
      return [];
    }
    
    // We need to reconstruct meetingIds manually or fetch them. 
    // For simplicity, we'll let the AppStore logic handle the `meetingIds` array based on the `folderId` in meetings.
    return data.map(mapFolderFromDB);
  },

  async createFolder(folder: Folder) {
    const { error } = await supabase.from('folders').insert({ id: folder.id, name: folder.name });
    if (error) console.error('Error creating folder:', JSON.stringify(error, null, 2));
  },

  async updateFolder(id: string, name: string) {
    const { error } = await supabase.from('folders').update({ name }).eq('id', id);
    if (error) console.error('Error updating folder:', JSON.stringify(error, null, 2));
  },

  async deleteFolder(id: string) {
    await supabase.from('folders').delete().eq('id', id);
  },

  // --- Voiceprints ---
  async fetchVoiceprints(): Promise<VoiceprintProfile[]> {
    const { data, error } = await supabase.from('voiceprints').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching voiceprints:', JSON.stringify(error, null, 2));
      return [];
    }
    return (data || []).map(mapVoiceprintFromDB);
  },

  async createVoiceprint(vp: VoiceprintProfile, audioBlob?: Blob) {
    if (audioBlob) {
       await supabase.storage.from('meeting-recordings').upload(`voiceprints/${vp.id}`, audioBlob);
    }
    const { error } = await supabase.from('voiceprints').insert({
      id: vp.id,
      name: vp.name,
      created_at: vp.createdAt.toISOString()
    });
    if (error) console.error('Error creating voiceprint:', JSON.stringify(error, null, 2));
  },

  async updateVoiceprint(id: string, name?: string, audioBlob?: Blob) {
    if (audioBlob) {
        await supabase.storage.from('meeting-recordings').upload(`voiceprints/${id}`, audioBlob, { upsert: true });
    }
    if (name) {
        await supabase.from('voiceprints').update({ name }).eq('id', id);
    }
  },

  async deleteVoiceprint(id: string) {
    await supabase.from('voiceprints').delete().eq('id', id);
    await supabase.storage.from('meeting-recordings').remove([`voiceprints/${id}`]);
  },

  // --- Templates ---
  async fetchTemplates(): Promise<Template[]> {
    const { data, error } = await supabase.from('templates').select('*');
    if (error) {
       console.error('Error fetching templates:', JSON.stringify(error, null, 2));
       return [];
    }
    return (data || []).map(mapTemplateFromDB);
  },

  async createTemplate(t: Template) {
    const { error } = await supabase.from('templates').insert({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      tags: t.tags,
      icon: t.icon,
      prompt: t.prompt,
      usage_count: t.usageCount,
      is_custom: t.isCustom,
      author: t.author,
      is_starred: t.isStarred,
      is_user_created: t.isUserCreated
    });
    if (error) console.error('Error creating template:', JSON.stringify(error, null, 2));
  },

  async seedTemplates(templates: Template[]) {
    // Batch insert templates
    const rows = templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      tags: t.tags,
      icon: t.icon,
      prompt: t.prompt,
      usage_count: t.usageCount,
      is_custom: t.isCustom,
      author: t.author,
      is_starred: t.isStarred,
      is_user_created: t.isUserCreated
    }));
    
    // Using upsert (ignore duplicates)
    const { error } = await supabase.from('templates').upsert(rows, { onConflict: 'id' });
    if (error) console.error('Error seeding templates:', JSON.stringify(error, null, 2));
  },

  async updateTemplate(id: string, updates: Partial<Template>) {
    // Map to DB columns... simplified for brevity, assume similar pattern
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.prompt) dbUpdates.prompt = updates.prompt;
    if (updates.isStarred !== undefined) dbUpdates.is_starred = updates.isStarred;
    
    await supabase.from('templates').update(dbUpdates).eq('id', id);
  },

  async deleteTemplate(id: string) {
    await supabase.from('templates').delete().eq('id', id);
  },

  // --- Hotwords ---
  async fetchHotwords(): Promise<Hotword[]> {
    const { data, error } = await supabase.from('hotwords').select('*').order('created_at', { ascending: false });
    if (error) {
       console.error('Error fetching hotwords:', JSON.stringify(error, null, 2));
       return [];
    }
    return (data || []).map(mapHotwordFromDB);
  },

  async createHotword(h: Hotword) {
    await supabase.from('hotwords').insert({
      id: h.id,
      word: h.word,
      category: h.category,
      created_at: h.createdAt.toISOString()
    });
  },

  async updateHotword(id: string, word: string, category: string) {
    await supabase.from('hotwords').update({ word, category }).eq('id', id);
  },

  async deleteHotword(id: string) {
    await supabase.from('hotwords').delete().eq('id', id);
  }
};