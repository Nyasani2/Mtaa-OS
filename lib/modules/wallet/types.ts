export interface WalletAccount {
  id: string;
  type: "main" | "savings" | "business" | "escrow";
  name: string;
  balance: number;
  currency: string;
  isDefault: boolean;
  color: string;
}

export interface WalletTransaction {
  id: string;
  type: "send" | "receive" | "deposit" | "withdraw" | "escrow" | "go_fund" | "fee" | "refund";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  description: string;
  recipient?: string;
  sender?: string;
  escrowId?: string;
  balanceAfter: number;
  timestamp: string;
}

export interface LinkedBank {
  id: string;
  name: string;
  accountNumber: string;
  branch: string;
  isDefault: boolean;
  verified: boolean;
}

export interface LinkedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface GoFundState {
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  interestRate: number;
  dailyFee: number;
  isActive: boolean;
  isEligible: boolean;
  dueDate: string | null;
  autoRepay: boolean;
  repaymentSource: "wallet" | "bank" | "deposit";
  creditScore: number;
  totalDrawnAllTime: number;
  totalRepaidAllTime: number;
  transactions: GoFundTransaction[];
}

export interface GoFundTransaction {
  id: string;
  type: "draw" | "repay" | "fee" | "interest" | "limit_change";
  amount: number;
  balanceAfter: number;
  timestamp: string;
  description: string;
  relatedTransactionId?: string;
}

export interface EscrowTransaction {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "held" | "released" | "disputed" | "refunded";
  recipientName: string;
  description: string;
  createdAt: string;
  heldUntil?: string;
  releasedAt?: string;
  disputeReason?: string;
}

export interface WalletNotification {
  id: string;
  type: "transaction" | "escrow" | "go_fund" | "security" | "system";
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

export interface WalletSettings {
  dailyLimit: number;
  transactionLimit: number;
  requirePinFor: string[];
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  autoRepayGoFund: boolean;
  defaultCurrency: string;
  hideBalance: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  accounts: WalletAccount[];
  activeAccountId: string;
  transactions: WalletTransaction[];
  linkedBanks: LinkedBank[];
  linkedCards: LinkedCard[];
  goFund: GoFundState;
  escrows: EscrowTransaction[];
  notifications: WalletNotification[];
  settings: WalletSettings;
}
