import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers?: string[];
  emails?: string[];
  company?: string;
  notes?: string;
  createdAt: string;
}

interface ContactState {
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  searchContacts: (query: string) => Contact[];
  loadContacts: () => Promise<void>;
  syncContacts: () => Promise<void>;
}

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      contacts: [],

      addContact: async (contact) => {
        const newContact: Contact = {
          id: `contact_${Date.now()}`,
          ...contact,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ contacts: [...s.contacts, newContact] }));

        // Sync to Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('contacts').insert({
            user_id: user.id,
            first_name: contact.firstName,
            last_name: contact.lastName,
            phone_numbers: contact.phoneNumbers,
            emails: contact.emails,
            company: contact.company,
            notes: contact.notes,
          });
        }
      },

      updateContact: (id, updates) => {
        set((s) => ({
          contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      deleteContact: (id) => {
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
      },

      searchContacts: (query) => {
        const q = query.toLowerCase();
        return get().contacts.filter((c) => {
          const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
          return (
            name.includes(q) ||
            c.phoneNumbers?.some((p) => p.includes(q)) ||
            c.emails?.some((e) => e.toLowerCase().includes(q)) ||
            c.company?.toLowerCase().includes(q)
          );
        });
      },

      loadContacts: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (data) {
          set({
            contacts: data.map((d: any) => ({
              id: d.id,
              firstName: d.first_name,
              lastName: d.last_name,
              phoneNumbers: d.phone_numbers,
              emails: d.emails,
              company: d.company,
              notes: d.notes,
              createdAt: d.created_at,
            })),
          });
        }
      },

      syncContacts: async () => {
        // TODO: Import from device contacts via expo-contacts
        await get().loadContacts();
      },
    }),
    { name: 'mtaa-contact-store' }
  )
);
