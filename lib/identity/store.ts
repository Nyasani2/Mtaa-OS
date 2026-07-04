import { create } from 'zustand';

interface IdentityState {
  identity: any;
  loading: boolean;
  verify: () => Promise<void>;
}

export const useIdentityStore = create<IdentityState>((set) => ({
  identity: null,
  loading: false,
  verify: async () => {
    // TODO: Implement
  },
}));
