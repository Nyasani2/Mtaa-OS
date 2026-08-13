// @ts-nocheck
// domains/phone/state/contactStore.ts
// Phone contact store — contacts, favorites, recent calls

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

// ─── Types ─────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  is_favorite: boolean;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  user_id: string;
  contact_id: string | null;
  phone_number: string;
  direction: 'incoming' | 'outgoing' | 'missed';
  duration: number;
  timestamp: string;
  notes: string | null;
}

interface ContactState {
  contacts: Contact[];
  favorites: Contact[];
  recentCalls: CallLog[];
  selectedContact: Contact | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;

  // Actions
  loadContacts: () => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<boolean>;
  deleteContact: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
  setSelectedContact: (contact: Contact | null) => void;
  setSearchQuery: (query: string) => void;
  loadRecentCalls: () => Promise<void>;
  logCall: (call: Omit<CallLog, 'id' | 'user_id'>) => Promise<boolean>;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  favorites: [],
  recentCalls: [],
  selectedContact: null,
  loading: false,
  error: null,
  searchQuery: '',

  // ─── Load Contacts ─────────────────────────────────────────────

  loadContacts: async () => {
    const user = useAuthStore.getState().user;
    if (!user?.id) return;

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      const contacts = (data || []) as Contact[];
      set({
        contacts,
        favorites: contacts.filter((c: any) => c.is_favorite),
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load contacts', loading: false });
    }
  },

  // ─── Add Contact ───────────────────────────────────────────────

  addContact: async (contact) => {
    const user = useAuthStore.getState().user;
    if (!user?.id) return false;

    set({ loading: true });
    const { error } = await supabase
      .from('contacts')
      .insert({ ...contact, user_id: user.id });

    if (error) {
      set({ error: error.message, loading: false });
      return false;
    }

    await get().loadContacts();
    return true;
  },

  // ─── Update Contact ────────────────────────────────────────────

  updateContact: async (id, updates) => {
    set({ loading: true });
    const { error } = await supabase
      .from('contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      set({ error: error.message, loading: false });
      return false;
    }

    await get().loadContacts();
    return true;
  },

  // ─── Delete Contact ──────────────────────────────────────────────

  deleteContact: async (id) => {
    set({ loading: true });
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      set({ error: error.message, loading: false });
      return false;
    }

    await get().loadContacts();
    return true;
  },

  // ─── Toggle Favorite ───────────────────────────────────────────

  toggleFavorite: async (id) => {
    const contact = get().contacts.find((c: any) => c.id === id);
    if (!contact) return false;

    return get().updateContact(id, { is_favorite: !contact.is_favorite });
  },

  // ─── Selection ─────────────────────────────────────────────────

  setSelectedContact: (contact) => set({ selectedContact: contact }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // ─── Call Logs ─────────────────────────────────────────────────

  loadRecentCalls: async () => {
    const user = useAuthStore.getState().user;
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[contactStore] loadRecentCalls error:', error);
      return;
    }

    set({ recentCalls: (data || []) as CallLog[] });
  },

  logCall: async (call) => {
    const user = useAuthStore.getState().user;
    if (!user?.id) return false;

    const { error } = await supabase
      .from('call_logs')
      .insert({ ...call, user_id: user.id });

    if (error) {
      console.error('[contactStore] logCall error:', error);
      return false;
    }

    await get().loadRecentCalls();
    return true;
  },
}));
