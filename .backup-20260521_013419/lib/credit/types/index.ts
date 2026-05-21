export interface CreditProfile {
  id: string;
  userId: string;
  score: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  limit: number;
  used: number;
  available: number;
  history: CreditEvent[];
  status: "active" | "frozen" | "suspended";
}

export interface CreditEvent {
  id: string;
  type: "payment" | "purchase" | "limit_change" | "fee" | "reward";
  amount: number;
  description: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

export interface Loan {
  id: string;
  userId: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  remainingBalance: number;
  status: "active" | "paid" | "defaulted" | "pending";
  nextDueDate: string;
  purpose: string;
}

export interface Investment {
  id: string;
  userId: string;
  type: "savings" | "bond" | "stock" | "fund";
  name: string;
  amount: number;
  returnRate: number;
  maturityDate?: string;
  status: "active" | "matured" | "withdrawn";
}

export interface Transaction {
  id: string;
  userId: string;
  type: "credit" | "debit" | "transfer" | "loan" | "investment";
  amount: number;
  currency: string;
  description: string;
  status: "completed" | "pending" | "failed";
  timestamp: string;
  counterparty?: string;
}
