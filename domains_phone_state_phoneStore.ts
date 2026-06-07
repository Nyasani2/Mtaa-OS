import { create } from 'zustand';

interface CallLog {
  id: string;
  number: string;
  name?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration: number;
}

interface PhoneState {
  callLogs: CallLog[];
  isDialing: boolean;
  activeCall: CallLog | null;
  addCallLog: (log: CallLog) => void;
  setActiveCall: (call: CallLog | null) => void;
  setDialing: (d: boolean) => void;
}

export const usePhoneStore = create<PhoneState>((set) => ({
  callLogs: [],
  isDialing: false,
  activeCall: null,
  addCallLog: (log) => set((s) => ({ callLogs: [log, ...s.callLogs] })),
  setActiveCall: (activeCall) => set({ activeCall }),
  setDialing: (isDialing) => set({ isDialing }),
}));

export default usePhoneStore;
