
import { supabase } from './supabaseClient';

export const authService = {
  async signInWithPassword(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signUp(email: string, password: string) {
    return await supabase.auth.signUp({
      email,
      password,
    });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getSession() {
    return await supabase.auth.getSession();
  },
  
  onAuthStateChange(callback: (event: any, session: any) => void) {
      return supabase.auth.onAuthStateChange(callback);
  }
};
