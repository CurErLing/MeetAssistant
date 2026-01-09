
import { supabase } from './supabaseClient';
import { MeetingFile, UserProfile } from '../types';

export const supabaseService = {
  async fetchUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, name: user.user_metadata.name || 'User' };
  },

  async uploadAudio(file: Blob, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('meeting-recordings')
      .upload(path, file, { upsert: true });

    if (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
    return data.path;
  },

  async createMeeting(meeting: MeetingFile, audioBlob: Blob) {
    const userProfile = await this.fetchUserProfile();
    if (!userProfile) throw new Error("Not logged in");
    const userId = userProfile.id;

    const audioPath = `${userId}/${meeting.id}.${meeting.format}`; 
    // This will now throw if upload fails, allowing catch block in store to handle it
    const uploadedPath = await this.uploadAudio(audioBlob, audioPath);

    const row = {
      id: meeting.id,
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
      deleted_at: null,
      user_id: userId
    };

    const { error } = await supabase.from('meetings').insert(row);
    if (error) {
      // Use console.error directly with the object to avoid {} output from JSON.stringify(Error)
      console.error('Error creating meeting:', error);
      throw error;
    }
  },

  async updateMeeting(id: string, updates: Partial<MeetingFile>) {
      const dbUpdates: any = { ...updates };
      if (updates.speakers) dbUpdates.speakers = updates.speakers;
      if (updates.transcript) dbUpdates.transcript = updates.transcript;
      if (updates.analyses) dbUpdates.analyses = updates.analyses;
      
      const { error } = await supabase.from('meetings').update(dbUpdates).eq('id', id);
      if (error) console.error("Update failed", error);
  }
};
