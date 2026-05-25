/**
 * Business Domain Types
 * Central type definitions for the business payments module
 */

export type BusinessType = 'sole_proprietorship' | 'llc' | 'partnership' | 'cooperative';
export type BusinessStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
export type SettlementFrequency = 'instant' | 'daily' | 'weekly' | 'monthly';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentType = 'till' | 'paybill';

export interface BusinessDocument {
  type: string;
  url: string;
  verified: boolean;
  uploaded_at: string;
}

export interface BankAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
  branch: string;
}

export interface BusinessInput {
  name: string;
  type: BusinessType;
  description?: string;
  category?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
  location?: string;
  phone: string;
  email?: string;
  kra_pin?: string;
  business_reg_number?: string;
}

export interface PaymentEvent {
  businessId: string;
  tillNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  senderPhone: string;
  senderName: string;
  amount: number;
  mpesaReceipt?: string;
  paymentId: string;
}

export interface FraudAlert {
  type: 'unusual_amount' | 'rapid_transactions' | 'suspicious_sender';
  severity: 'low' | 'medium' | 'high' | 'critical';
  messageId: string;
  details: Record<string, any>;
  recommendation: string;
}
