export interface Loan {
  id: string; user_id: string; amount: number; interest_rate: number; term_months: number;
  status: string; purpose: string; created_at: string;
}
export interface CreditScore {
  id: string; user_id: string; score: number; updated_at: string;
}
