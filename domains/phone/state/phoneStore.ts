// domains/phone/state/phoneStore.ts
// Phone module Zustand store for MTAA OS
// Imported by: app/(os)/phone/contact-detail.tsx, app/(os)/phone/contact-new.tsx

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface PhoneContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  type: 'personal' | 'business' | 'emergency';
  isFavorite: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CallLogEntry {
  id: string;
  user_id: string;
  contact_id?: string;
  phone_number: string;
  direction: 'incoming' | 'outgoing' | 'missed';
  duration: number; // seconds
  started_at: string;
  ended_at?: string;
  status: 'completed' | 'missed' | 'rejected' | 'voicemail';
}

interface PhoneState {
  contacts: PhoneContact[];
  callLogs: CallLogEntry[];
  recentCalls: CallLogEntry[];
  favorites: PhoneContact[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchContacts: () => Promise<void>;
  fetchCallLogs: () => Promise<void>;
  addContact: (contact: Partial<PhoneContact>) => Promise<PhoneContact | null>;
  updateContact: (id: string, updates: Partial<PhoneContact>) => Promise<PhoneContact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
  searchContacts: (query: string) => PhoneContact[];
  getContactById: (id: string) => PhoneContact | undefined;
  logCall: (entry: Partial<CallLogEntry>) => Promise<CallLogEntry | null>;
}

export const usePhoneStore = create<PhoneState>((set, get) => ({
  contacts: [],
  callLogs: [],
  recentCalls: [],
  favorites: [],
  loading: false,
  error: null,

  fetchContacts: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ loading: false }); return; }

      const { data, error } = await supabase
        .from('phone_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      const contacts = (data || []) as PhoneContact[];
      set({
        contacts,
        favorites: contacts.filter((c) => c.isFavorite),
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchCallLogs: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ loading: false }); return; }

      const { data, error } = await supabase
        .from('phone_call_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      const logs = (data || []) as CallLogEntry[];
      set({ callLogs: logs, recentCalls: logs.slice(0, 10), loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  addContact: async (contact) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ loading: false }); return null; }

      const { data, error } = await supabase
        .from('phone_contacts')
        .insert({ ...contact, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      const newContact = data as PhoneContact;
      set((state) => ({
        contacts: [...state.contacts, newContact].sort((a, b) => a.name.localeCompare(b.name)),
        favorites: newContact.isFavorite ? [...state.favorites, newContact] : state.favorites,
        loading: false,
      }));
      return newContact;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },

  updateContact: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('phone_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updated = data as PhoneContact;
      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === id ? updated : c)),
        favorites: updated.isFavorite
          ? [...state.favorites.filter((f) => f.id !== id), updated]
          : state.favorites.filter((f) => f.id !== id),
        loading: false,
      }));
      return updated;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },

  deleteContact: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('phone_contacts').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
        favorites: state.favorites.filter((f) => f.id !== id),
        loading: false,
      }));
      return true;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return false;
    }
  },

  toggleFavorite: async (id) => {
    const contact = get().contacts.find((c) => c.id === id);
    if (!contact) return false;
    const updated = await get().updateContact(id, { isFavorite: !contact.isFavorite });
    return !!updated;
  },

  searchContacts: (query) => {
    const q = query.toLowerCase();
    return get().contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  },

  getContactById: (id) => {
    return get().contacts.find((c) => c.id === id);
  },

  logCall: async (entry) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ loading: false }); return null; }

      const { data, error } = await supabase
        .from('phone_call_logs')
        .insert({ ...entry, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      const log = data as CallLogEntry;
      set((state) => ({
        callLogs: [log, ...state.callLogs],
        recentCalls: [log, ...state.recentCalls].slice(0, 10),
        loading: false,
      }));
      return log;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },
}));

export default usePhoneStore;
