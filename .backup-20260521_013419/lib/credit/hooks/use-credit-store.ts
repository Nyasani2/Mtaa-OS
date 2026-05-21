import { create } from "zustand";
import { getCreditProfile, getLoans, getInvestments, getTransactions, applyForLoan } from "@/lib/credit/services/credit-service";
import type { CreditProfile, Loan, Investment, Transaction } from "@/lib/credit/types";

interface CreditState {
  profile: CreditProfile | null;
  loans: Loan[];
  investments: Investment[];
  transactions: Transaction[];
  loading: boolean;
  refresh: (userId: string) => Promise<void>;
  applyLoan: (userId: string, amount: number, months: number, purpose: string) => Promise<void>;
}

export const useCreditStore = create<CreditState>((set) => ({
  profile: null,
  loans: [],
  investments: [],
  transactions: [],
  loading: false,
  refresh: async (userId: string) => {
    set({ loading: true });
    try {
      const [profile, loans, investments, transactions] = await Promise.all([
        getCreditProfile(userId),
        getLoans(userId),
        getInvestments(userId),
        getTransactions(userId),
      ]);
      set({ profile, loans, investments, transactions, loading: false });
    } catch { set({ loading: false }); }
  },
  applyLoan: async (userId, amount, months, purpose) => {
    await applyForLoan(userId, amount, months, purpose);
    const loans = await getLoans(userId);
    set({ loans });
  },
}));
