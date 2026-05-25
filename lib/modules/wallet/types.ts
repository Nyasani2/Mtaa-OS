export type TransactionType =
  | "send"
  | "receive"
  | "deposit"
  | "withdraw"
  | "qr_pay"
  | "escrow_hold"
  | "escrow_release"
  | "escrow_dispute"
  | "go_fund_draw"
  | "go_fund_repay"
  | "go_fund_fee"
  | "go_fund_interest"
  | "refund";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "disputed";

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  recipientName?: string;
  recipientPhone?: string;
  recipientId?: string;
  senderName?: string;
  senderId?: string;
  note?: string;
  description?: string;
  balanceBefore: number;
  balanceAfter: number;
  goFundUsed?: number;
  escrowId?: string;
  qrCode?: string;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface WalletAccount {
  id: string;
  type: "main" | "savings" | "business";
  name: string;
  balance: number;
  currency: string;
  isDefault: boolean;
  color: string;
  maskedNumber?: string;
}

export interface LinkedBank {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  isDefault: boolean;
}

export interface LinkedCard {
  id: string;
  cardType: "visa" | "mastercard" | "amex";
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
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
  type: "payment_received" | "payment_sent" | "escrow_update" | "go_fund_draw" | "go_fund_repay_due" | "go_fund_repayed" | "go_fund_limit_change" | "system_alert" | "security_alert";
  title: string;
  message: string;
  amount?: number;
  isRead: boolean;
  createdAt: string;
  actionRoute?: string;
}

export interface WalletSettings {
  dailyLimit: number;
  transactionLimit: number;
  requirePinFor: ("send" | "withdraw" | "qr_pay" | "go_fund")[];
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  autoRepayGoFund: boolean;
  defaultCurrency: string;
  hideBalance: boolean;
}

export interface SendMoneyForm {
  recipientPhone: string;
  recipientName: string;
  amount: string;
  note: string;
  useGoFund: boolean;
}

export interface DepositForm {
  method: "bank" | "mobile_money" | "crypto" | "qr" | "go_fund_repay";
  amount: string;
  bankId?: string;
  phoneNumber?: string;
  cryptoAddress?: string;
}

export interface WithdrawForm {
  method: "bank" | "agent" | "mobile_money";
  amount: string;
  destinationId?: string;
  agentCode?: string;
  phoneNumber?: string;
}

export interface GoFundTransaction {
  id: string;
  wallet_id: string;
  type: 'draw' | 'repay';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  created_at: string;
  balanceAfter: number;
  timestamp: string;
}
