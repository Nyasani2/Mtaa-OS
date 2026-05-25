import { supabase } from '@/lib/supabase/client';

export interface PinEngine {
  setPin: (pin: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  hasPin: () => Promise<boolean>;
  clearPin: () => Promise<boolean>;
}

export const pinEngine: PinEngine = {
  async setPin(pin: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const hash = await hashPin(pin);
    const { error } = await supabase.from('profiles').update({ pin_hash: hash }).eq('user_id', user.id);
    return !error;
  },
  async verifyPin(pin: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('pin_hash').eq('user_id', user.id).single();
    if (!profile?.pin_hash) return false;
    const hash = await hashPin(pin);
    return hash === profile.pin_hash;
  },
  async hasPin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('pin_hash').eq('user_id', user.id).single();
    return !!profile?.pin_hash;
  },
  async clearPin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from('profiles').update({ pin_hash: null }).eq('user_id', user.id);
    return !error;
  },
};

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'mtaa_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
