// domains/phone/state/phoneStore.ts — Phone State
import { create } from 'zustand';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  avatar?: string;
}

export interface CallLog {
  id: string;
  contactId: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: number;
  timestamp: string;
}

interface PhoneState {
  contacts: Contact[];
  callLogs: CallLog[];
  activeCall: Contact | null;
  isDialing: boolean;
  addContact: (contact: Omit<Contact, 'id'>) => void;
  removeContact: (id: string) => void;
  startCall: (contact: Contact) => void;
  endCall: () => void;
}

export const usePhoneStore = create<PhoneState>((set) => ({
  contacts: [],
  callLogs: [],
  activeCall: null,
  isDialing: false,
  addContact: (contact) => set((state) => ({
    contacts: [...state.contacts, { ...contact, id: Date.now().toString() }],
  })),
  removeContact: (id) => set((state) => ({
    contacts: state.contacts.filter((c) => c.id !== id),
  })),
  startCall: (contact) => set({ activeCall: contact, isDialing: true }),
  endCall: () => set({ activeCall: null, isDialing: false }),
}));

export default usePhoneStore;
