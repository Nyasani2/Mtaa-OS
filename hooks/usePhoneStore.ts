import { create } from 'zustand';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface CallRecord {
  id: string;
  name: string;
  number: string;
  type: 'incoming' | 'outgoing' | 'missed';
  time: string;
}

interface PhoneState {
  contacts: Contact[];
  recentCalls: CallRecord[];
  addContact: (contact: Contact) => void;
  addCall: (call: CallRecord) => void;
}

export const usePhoneStore = create<PhoneState>((set) => ({
  contacts: [
    { id: '1', name: 'Emergency', phone: '999' },
    { id: '2', name: 'Support', phone: '0800-123-456' },
  ],
  recentCalls: [
    { id: '1', name: 'Support', number: '0800-123-456', type: 'incoming', time: '10:00 AM' },
  ],
  addContact: (contact) => set((state) => ({ contacts: [...state.contacts, contact] })),
  addCall: (call) => set((state) => ({ recentCalls: [call, ...state.recentCalls] })),
}));

export default usePhoneStore;
