import { create } from 'zustand';

interface PhoneState {
  contacts: any[];
  calls: any[];
  activeCall: any | null;
  setContacts: (c: any[]) => void;
  addCall: (c: any) => void;
  setActiveCall: (c: any | null) => void;
}

export const usePhoneStore = create<PhoneState>((set, get) => ({
  contacts: [],
  calls: [],
  activeCall: null,
  setContacts: (contacts) => set({ contacts }),
  addCall: (call) => set({ calls: [call, ...get().calls] }),
  setActiveCall: (activeCall) => set({ activeCall }),
}));
