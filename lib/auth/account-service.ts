// @ts-nocheck
import { supabase } from '@/lib/supabase';

export const accountService = {
  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('logout error', e);
    }
  },

  async deleteAccount() {
    // 1) Try the edge function (service-role deletes auth user)
    let edgeOk = false;
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (!error) edgeOk = true;
    } catch (e) {
      edgeOk = false;
    }

    // 2) Fallback: wipe user-owned profile rows, then sign out
    if (!edgeOk) {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (uid) {
          await supabase.from('user_profiles').delete().eq('user_id', uid);
        }
      } catch (e) {
        console.warn('fallback delete error', e);
      }
    }

    await supabase.auth.signOut();
  },
};
