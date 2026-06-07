import { create } from 'zustand';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
}

interface ContactState {
  contacts: Contact[];
  addContact: (c: Contact) => void;
  removeContact: (id: string) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
}

export const useContactStore = create<ContactState>((set) => ({
  contacts: [],
  addContact: (contact) => set((s) => ({ contacts: [...s.contacts, contact] })),
  removeContact: (id) => set((s) => ({ contacts: s.contacts.filter(c => c.id !== id) })),
  updateContact: (id, updates) => set((s) => ({
    contacts: s.contacts.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
}));

export default useContactStore;
