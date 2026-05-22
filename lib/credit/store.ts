import { create } from 'zustand';

export interface CreditState {
  score: number;
  tier: string;
  history: any[];
  loading: boolean;
}

export const useCreditStore = create<CreditState>((set) => ({
  score: 650,
  tier: 'standard',
  history: [],
  loading: false,
}));
