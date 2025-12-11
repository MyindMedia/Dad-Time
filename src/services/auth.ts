import { supabase } from '../lib/supabase';

export const AuthService = {
  async getUser() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  },
  async signIn(email: string, password: string) {
    if (!supabase) return { error: 'Supabase not configured' } as const;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error } as const;
  },
  async signUp(email: string, password: string) {
    if (!supabase) return { error: 'Supabase not configured' } as const;
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error } as const;
  },
  async signOut() {
    if (!supabase) return { error: null } as const;
    const { error } = await supabase.auth.signOut();
    return { error } as const;
  },
  onAuthStateChange(callback: (event: string) => void) {
    if (!supabase) return () => {};
    const { data: sub } = supabase.auth.onAuthStateChange((event) => callback(event));
    return () => sub.subscription.unsubscribe();
  },
};
