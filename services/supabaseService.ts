
import { supabase } from './supabaseClient';
import { MeetingFile, Folder, VoiceprintProfile, Hotword, Template } from '../types';

// --- Data Mapping Helpers ---

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
  meetingIds: [] // Populated by join on frontend
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

// Helper to get current user ID
const getCurrentUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
};

// --- Service Methods ---

export const supabaseService = {
  // --- Meetings ---
  async fetchMeetings(): Promise<{ active: MeetingFile[], deleted: MeetingFile[] }> {
    const userId = await getCurrentUserId();
    if (!userId) return { active: [], deleted: [] };

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', userId) // Filter by current user
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meetings:', error);
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
      console.error('Error uploading audio:', error);
      return null;
    }
    return data.path;
  },

  async createMeeting(meeting: MeetingFile, audioBlob: Blob) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    // Use userId in path for RLS compatibility
    const audioPath = `${userId}/${meeting.id}.${meeting.format}`;
    const uploadedPath = await this.uploadAudio(audioBlob, audioPath);

    if (!uploadedPath) throw new Error("Audio upload failed");

    const row = {
      id: meeting.id,
      user_id: userId, // Explicit binding
      name: meeting.name,
      duration: Math.round(meeting.duration || 0),
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
      console.error('Error creating meeting:', error);
      throw error;
    }
  },

  async updateMeeting(id: string, updates: Partial<MeetingFile>) {
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
    if (error) console.error('Error updating meeting:', error);
  },

  async deleteMeetingPermanent(id: string, format: string) {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await supabase.from('meetings').delete().eq('id', id);
    // Remove from user specific folder
    await supabase.storage.from('meeting-recordings').remove([`${userId}/${id}.${format}`]);
  },

  // --- Folders ---
  async fetchFolders(): Promise<Folder[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId); // Filter by current user

    if (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
    return data.map(mapFolderFromDB);
  },

  async createFolder(folder: Folder) {
    const userId = await getCurrentUserId();
    const { error } = await supabase.from('folders').insert({ 
      id: folder.id, 
      name: folder.name,
      user_id: userId // Bind to user
    });
    if (error) console.error('Error creating folder:', error);
  },

  async updateFolder(id: string, name: string) {
    const { error } = await supabase.from('folders').update({ name }).eq('id', id);
    if (error) console.error('Error updating folder:', error);
  },

  async deleteFolder(id: string) {
    await supabase.from('folders').delete().eq('id', id);
  },

  // --- Voiceprints ---
  async fetchVoiceprints(): Promise<VoiceprintProfile[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('voiceprints')
      .select('*')
      .eq('user_id', userId) // Filter by current user
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(mapVoiceprintFromDB);
  },

  async createVoiceprint(vp: VoiceprintProfile, audioBlob?: Blob) {
    const userId = await getCurrentUserId();
    if (!userId) return;

    if (audioBlob) {
       // Upload to user folder
       await supabase.storage.from('meeting-recordings').upload(`${userId}/voiceprints/${vp.id}`, audioBlob);
    }
    const { error } = await supabase.from('voiceprints').insert({
      id: vp.id,
      user_id: userId,
      name: vp.name,
      created_at: vp.createdAt.toISOString()
    });
    if (error) console.error('Error creating voiceprint:', error);
  },

  async updateVoiceprint(id: string, name?: string, audioBlob?: Blob) {
    const userId = await getCurrentUserId();
    if (!userId) return;

    if (audioBlob) {
        await supabase.storage.from('meeting-recordings').upload(`${userId}/voiceprints/${id}`, audioBlob, { upsert: true });
    }
    if (name) {
        await supabase.from('voiceprints').update({ name }).eq('id', id);
    }
  },

  async deleteVoiceprint(id: string) {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await supabase.from('voiceprints').delete().eq('id', id);
    await supabase.storage.from('meeting-recordings').remove([`${userId}/voiceprints/${id}`]);
  },

  // --- Templates ---
  async fetchTemplates(): Promise<Template[]> {
    const userId = await getCurrentUserId();
    
    // Fetch public (system) templates OR user's private templates
    let query = supabase.from('templates').select('*');
    
    if (userId) {
       query = query.or(`user_id.eq.${userId},is_user_created.eq.false`);
    } else {
       query = query.eq('is_user_created', false);
    }

    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(mapTemplateFromDB);
  },

  async createTemplate(t: Template) {
    const userId = await getCurrentUserId();
    const { error } = await supabase.from('templates').insert({
      id: t.id,
      user_id: userId,
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
    if (error) console.error('Error creating template:', error);
  },

  async seedTemplates(templates: Template[]) {
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
    
    const { error } = await supabase.from('templates').upsert(rows, { onConflict: 'id' });
    if (error) console.error('Error seeding templates:', error);
  },

  async updateTemplate(id: string, updates: Partial<Template>) {
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
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('hotwords')
      .select('*')
      .eq('user_id', userId) // Filter by current user
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(mapHotwordFromDB);
  },

  async createHotword(h: Hotword) {
    const userId = await getCurrentUserId();
    await supabase.from('hotwords').insert({
      id: h.id,
      user_id: userId,
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
