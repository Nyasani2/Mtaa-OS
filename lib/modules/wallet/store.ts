// lib/modules/wallet/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  WalletAccount,
  WalletTransaction,
  LinkedBank,
  LinkedCard,
  GoFundState,
  EscrowTransaction,
  WalletNotification,
  WalletSettings,
} from "./types";

interface WalletState {
  accounts: WalletAccount[];
  activeAccountId: string;
  transactions: WalletTransaction[];
  linkedBanks: LinkedBank[];
  linkedCards: LinkedCard[];
  goFund: GoFundState;
  escrows: EscrowTransaction[];
  notifications: WalletNotification[];
  settings: WalletSettings;
  hideBalance: boolean;
  isLoading: boolean;
  error: string | null;
}

interface WalletActions {
  setActiveAccount: (id: string) => void;
  addAccount: (account: WalletAccount) => void;
  addTransaction: (tx: WalletTransaction) => void;
  updateTransaction: (id: string, updates: Partial<WalletTransaction>) => void;
  drawGoFund: (amount: number, description: string, relatedTxId?: string) => boolean;
  repayGoFund: (amount: number, source: "wallet" | "bank" | "deposit") => boolean;
  toggleGoFund: (active: boolean) => void;
  setAutoRepay: (auto: boolean) => void;
  setRepaymentSource: (source: "wallet" | "bank" | "deposit") => void;
  addEscrow: (escrow: EscrowTransaction) => void;
  releaseEscrow: (id: string) => void;
  disputeEscrow: (id: string, reason: string) => void;
  addNotification: (n: WalletNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  updateSettings: (settings: Partial<WalletSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleHideBalance: () => void;
  removeLinkedBank: (id: string) => void;
  removeLinkedCard: (id: string) => void;
  // NEW: Server sync
  syncAccounts: (accounts: WalletAccount[]) => void;
  syncTransactions: (transactions: WalletTransaction[]) => void;
  syncNotifications: (notifications: WalletNotification[]) => void;
  syncBalance: (accountId: string, balance: number) => void;
}

const DEFAULT_ACCOUNTS: WalletAccount[] = [
  {
    id: "main",
    type: "main",
    name: "Main Wallet",
    balance: 12500.75,
    currency: "KES",
    isDefault: true,
    color: "#10B981",
  },
  {
    id: "savings",
    type: "savings",
    name: "Savings",
    balance: 45000.0,
    currency: "KES",
    isDefault: false,
    color: "#3B82F6",
  },
];

const DEFAULT_GO_FUND: GoFundState = {
  creditLimit: 5000,
  creditUsed: 0,
  creditAvailable: 5000,
  interestRate: 0.01,
  dailyFee: 5,
  isActive: true,
  isEligible: true,
  dueDate: null,
  autoRepay: true,
  repaymentSource: "wallet",
  creditScore: 720,
  totalDrawnAllTime: 0,
  totalRepaidAllTime: 0,
  transactions: [],
};

const DEFAULT_SETTINGS: WalletSettings = {
  dailyLimit: 50000,
  transactionLimit: 20000,
  requirePinFor: ["send", "withdraw", "go_fund"],
  biometricEnabled: false,
  notificationsEnabled: true,
  autoRepayGoFund: true,
  defaultCurrency: "KES",
  hideBalance: false,
};

/**
 * Generate cryptographically secure UUID
 * Uses crypto.randomUUID() when available, falls back to timestamp+random
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  const timestamp = Date.now().toString(36);
  const randomBytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Last resort — Math.random (only in fallback path)
    for (let i = 0; i < 8; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const randomHex = Array.from(randomBytes).map((b: number) => b.toString(16).padStart(2, '0')).join('');
  return `${timestamp}-${randomHex}`;
}

export const useWalletStore = create<WalletState & WalletActions>()(
  persist(
    (set, get) => ({
      accounts: DEFAULT_ACCOUNTS,
      activeAccountId: "main",
      transactions: [],
      linkedBanks: [],
      linkedCards: [],
      goFund: DEFAULT_GO_FUND,
      escrows: [],
      notifications: [],
      settings: DEFAULT_SETTINGS,
      hideBalance: false,
      isLoading: false,
      error: null,

      setActiveAccount: (id) => set({ activeAccountId: id }),

      addAccount: (account) =>
        set((state) => ({ accounts: [...state.accounts, account] })),

      addTransaction: (tx) =>
        set((state) => {
          const newTxs = [tx, ...state.transactions];
          const accounts = state.accounts.map((acc) => {
            if (acc.id === state.activeAccountId) {
              return { ...acc, balance: tx.balanceAfter };
            }
            return acc;
          });
          return { transactions: newTxs.slice(0, 200), accounts };
        }),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
        })),

      drawGoFund: (amount, description, relatedTxId) => {
        const state = get();
        const goFund = state.goFund;
        if (!goFund.isActive || !goFund.isEligible) return false;
        if (amount > goFund.creditAvailable) return false;

        const newUsed = goFund.creditUsed + amount;
        const newAvailable = goFund.creditLimit - newUsed;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const drawTx = {
          id: generateId(),
          type: "draw" as const,
          amount,
          balanceAfter: newUsed,
          timestamp: new Date().toISOString(),
          description,
          relatedTransactionId: relatedTxId,
        };

        set({
          goFund: {
            ...goFund,
            creditUsed: newUsed,
            creditAvailable: newAvailable,
            totalDrawnAllTime: goFund.totalDrawnAllTime + amount,
            dueDate: dueDate.toISOString(),
            transactions: [drawTx, ...goFund.transactions],
          },
        });

        get().addNotification({
          id: generateId(),
          type: "go_fund_draw",
          title: "Go Fund Used",
          message: `You used KSh ${amount.toLocaleString()} from Go Fund`,
          amount,
          read: false,
          isRead: false,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          actionRoute: "/wallet/credit",
        });

        return true;
      },

      repayGoFund: (amount, source) => {
        const state = get();
        const goFund = state.goFund;
        if (goFund.creditUsed <= 0) return false;

        const repayAmount = Math.min(amount, goFund.creditUsed);
        const newUsed = goFund.creditUsed - repayAmount;
        const newAvailable = goFund.creditLimit - newUsed;

        const repayTx = {
          id: generateId(),
          type: "repay" as const,
          amount: repayAmount,
          balanceAfter: newUsed,
          timestamp: new Date().toISOString(),
          description: `Repayment from ${source}`,
        };

        set({
          goFund: {
            ...goFund,
            creditUsed: newUsed,
            creditAvailable: newAvailable,
            totalRepaidAllTime: goFund.totalRepaidAllTime + repayAmount,
            dueDate: newUsed > 0 ? goFund.dueDate : null,
            transactions: [repayTx, ...goFund.transactions],
          },
        });

        if (source === "wallet") {
          const activeAcc = state.accounts.find((a) => a.id === state.activeAccountId);
          if (activeAcc && activeAcc.balance >= repayAmount) {
            const newBalance = activeAcc.balance - repayAmount;
            set({
              accounts: state.accounts.map((a) =>
                a.id === state.activeAccountId ? { ...a, balance: newBalance } : a
              ),
            });
          }
        }

        get().addNotification({
          id: generateId(),
          type: "go_fund_repayed",
          title: "Go Fund Repaid",
          message: `KSh ${repayAmount.toLocaleString()} repaid successfully`,
          amount: repayAmount,
          read: false,
          isRead: false,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });

        return true;
      },

      toggleGoFund: (active) =>
        set((state) => ({
          goFund: { ...state.goFund, isActive: active },
        })),

      setAutoRepay: (auto) =>
        set((state) => ({
          goFund: { ...state.goFund, autoRepay: auto },
        })),

      setRepaymentSource: (source) =>
        set((state) => ({
          goFund: { ...state.goFund, repaymentSource: source },
        })),

      addEscrow: (escrow) =>
        set((state) => ({ escrows: [escrow, ...state.escrows] })),

      releaseEscrow: (id) =>
        set((state) => ({
          escrows: state.escrows.map((e) =>
            e.id === id
              ? { ...e, status: "released" as const, releasedAt: new Date().toISOString() }
              : e
          ),
        })),

      disputeEscrow: (id, reason) =>
        set((state) => ({
          escrows: state.escrows.map((e) =>
            e.id === id ? { ...e, status: "disputed" as const, disputeReason: reason } : e
          ),
        })),

      toggleHideBalance: () =>
        set((state) => ({
          hideBalance: !state.hideBalance,
          settings: { ...state.settings, hideBalance: !state.settings.hideBalance },
        })),

      removeLinkedBank: (id) =>
        set((state) => ({
          linkedBanks: state.linkedBanks.filter((b) => b.id !== id),
        })),

      removeLinkedCard: (id) =>
        set((state) => ({
          linkedCards: state.linkedCards.filter((c) => c.id !== id),
        })),

      addNotification: (n) =>
        set((state) => ({
          notifications: [n, ...state.notifications].slice(0, 50),
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      clearNotifications: () => set({ notifications: [] }),

      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // NEW: Server sync actions — reconcile local state with server truth
      syncAccounts: (accounts) => set({ accounts }),
      syncTransactions: (transactions) => set({ transactions: transactions.slice(0, 200) }),
      syncNotifications: (notifications) => set({ notifications: notifications.slice(0, 50) }),
      syncBalance: (accountId, balance) =>
        set((state) => ({
          accounts: state.accounts.map((acc) =>
            acc.id === accountId ? { ...acc, balance } : acc
          ),
        })),
    }),
    {
      name: "mtaa-wallet-store",
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
        transactions: state.transactions,
        linkedBanks: state.linkedBanks,
        linkedCards: state.linkedCards,
        goFund: state.goFund,
        escrows: state.escrows,
        notifications: state.notifications,
        settings: state.settings,
        hideBalance: state.hideBalance,
      }),
    }
  )
);

export default useWalletStore;
