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
  type: "send" | "receive" | "deposit" | "withdraw" | "escrow" | "go_fund" | "fee" | "refund" | "qr_pay" | "go_fund_draw" | "go_fund_repay" | "escrow_hold" | "escrow_release" | "escrow_dispute";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  description: string;
  recipient?: string;
  recipientName?: string;
  recipientPhone?: string;
  sender?: string;
  senderName?: string;
  escrowId?: string;
  note?: string;
  qrCode?: string;
  goFundUsed?: number;
  balanceBefore?: number;
  balanceAfter: number;
  timestamp: string;
  createdAt?: string;
  completedAt?: string;
}

export interface LinkedBank {
  id: string;
  name: string;
  bankName?: string;
  accountName?: string;
  accountNumber: string;
  branch: string;
  isDefault: boolean;
  verified: boolean;
}

export interface LinkedCard {
  id: string;
  last4: string;
  brand: string;
  cardType?: string;
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
  type: "transaction" | "escrow" | "go_fund" | "security" | "system" | "payment_received" | "payment_sent" | "escrow_update" | "go_fund_draw" | "go_fund_repay_due" | "go_fund_repayed" | "go_fund_limit_change" | "system_alert" | "security_alert";
  title: string;
  message: string;
  amount?: number;
  read: boolean;
  isRead?: boolean;
  timestamp: string;
  createdAt?: string;
  actionUrl?: string;
  actionRoute?: string;
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

// Export TransactionType alias for history.tsx
export type TransactionType = WalletTransaction["type"];

