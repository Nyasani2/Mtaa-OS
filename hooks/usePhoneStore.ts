import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

export interface Contact {
  id: string; name: string; phone: string; email?: string;
  avatar?: string; type: 'personal' | 'business' | 'emergency'; isFavorite?: boolean;
}

export interface CallLog {
  id: string; contact_id?: string; phone: string; name?: string;
  type: 'incoming' | 'outgoing' | 'missed'; duration?: number; timestamp: string;
}

interface PhoneState {
  contacts: Contact[]; callLogs: CallLog[]; recentCalls: CallLog[];
  isLoading: boolean; error: string | null; selectedContact: Contact | null;
  searchQuery: string; activeTab: 'contacts' | 'recent' | 'favorites';
  setSearchQuery: (q: string) => void; setActiveTab: (t: any) => void;
  setSelectedContact: (c: Contact | null) => void;
  fetchContacts: () => Promise<void>;
  addContact: (c: Omit<Contact, 'id'>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addCallLog: (l: Omit<CallLog, 'id'>) => void;
  clearError: () => void;
}

export const usePhoneStore = create<PhoneState>((set, get) => ({
  contacts: [], callLogs: [], recentCalls: [], isLoading: false, error: null,
  selectedContact: null, searchQuery: '', activeTab: 'contacts',
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveTab: (t) => set({ activeTab: t }),
  setSelectedContact: (c) => set({ selectedContact: c }),
  fetchContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('contacts').select('*').order('name');
      if (error) throw error;
      set({ contacts: data || [], isLoading: false });
    } catch (err: any) { set({ error: err.message, isLoading: false }); }
  },
  addContact: async (contact) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('contacts').insert(contact).select().single();
      if (error) throw error;
      set((s) => ({ contacts: [...s.contacts, data], isLoading: false }));
    } catch (err: any) { set({ error: err.message, isLoading: false }); }
  },
  deleteContact: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
      set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id), isLoading: false }));
    } catch (err: any) { set({ error: err.message, isLoading: false }); }
  },
  toggleFavorite: async (id) => {
    const contact = get().contacts.find((c) => c.id === id);
    if (!contact) return;
    try {
      const { error } = await supabase.from('contacts').update({ isFavorite: !contact.isFavorite }).eq('id', id);
      if (error) throw error;
      set((s) => ({ contacts: s.contacts.map((c) => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c) }));
    } catch (err: any) { set({ error: err.message }); }
  },
  addCallLog: (log) => {
    const newLog: CallLog = { ...log, id: Date.now().toString() };
    set((s) => ({ callLogs: [newLog, ...s.callLogs], recentCalls: [newLog, ...s.recentCalls].slice(0, 50) }));
  },
  clearError: () => set({ error: null }),
}));

export default usePhoneStore;
