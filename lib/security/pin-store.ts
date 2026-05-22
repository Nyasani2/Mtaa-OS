import { create } from 'zustand';

interface PinState {
  pin: string | null;
  isSet: boolean;
  setPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  clearPin: () => void;
}

export const PinStore = create<PinState>((set, get) => ({
  pin: null,
  isSet: false,
  setPin: (pin) => set({ pin, isSet: true }),
  verifyPin: (pin) => get().pin === pin,
  clearPin: () => set({ pin: null, isSet: false }),
}));

export const pinStore = PinStore;
