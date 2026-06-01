export type BusinessType = "sole_proprietorship" | "partnership" | "limited_company" | "corporation" | "cooperative" | "ngo" | "llc";
export type BusinessStatus = "active" | "inactive" | "suspended" | "pending_verification";
export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled" | "completed";
export type SettlementFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export interface Business {
  id: string;
  user_id: string;
  name: string;
  type: BusinessType;
  registration_number: string;
  tax_pin: string;
  status: BusinessStatus;
  verified: boolean;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  till_number?: string;
  paybill_number?: string;
  documents?: Record<string, string>;
  fee_percentage?: number;
  settlement_frequency?: SettlementFrequency;
  settlement_threshold?: number;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: BusinessType;
  registration_number: string;
  tax_pin: string;
  status: BusinessStatus;
  verified: boolean;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessServiceItem {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface BusinessPayment {
  id: string;
  business_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  settlement_frequency: SettlementFrequency;
  due_date: string;
  paid_at?: string;
  created_at: string;
}

export interface TillPayment {
  id: string;
  business_id: string;
  till_number: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customer_phone?: string;
  receipt_number?: string;
  sender_name?: string;
  sender_phone?: string;
  created_at: string;
}

export interface PaybillPayment {
  id: string;
  business_id: string;
  paybill_number: string;
  account_number: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customer_phone?: string;
  receipt_number?: string;
  sender_name?: string;
  sender_phone?: string;
  created_at: string;
}

export interface BusinessAnalytics {
  total_revenue: number;
  total_transactions: number;
  average_transaction_value: number;
  customer_count: number;
  top_services: { name: string; revenue: number }[];
  monthly_growth: number;
}

export const businessService = {
  async getBusinessByOwner(userId: string): Promise<Business | null> {
    return null;
  },

  async registerBusiness(data: Omit<Business, "id" | "created_at" | "updated_at">): Promise<Business> {
    return { ...data, id: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  },

  async getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    return null;
  },

  async createBusinessProfile(profile: Omit<BusinessProfile, "id" | "created_at" | "updated_at">): Promise<BusinessProfile> {
    return { ...profile, id: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  },

  async updateBusinessProfile(id: string, updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
    return { id, user_id: "", business_name: "", business_type: "sole_proprietorship", registration_number: "", tax_pin: "", status: "active", verified: false, created_at: "", updated_at: "", ...updates };
  },

  async getBusinessServices(businessId: string): Promise<BusinessServiceItem[]> {
    return [];
  },

  async createBusinessService(service: Omit<BusinessServiceItem, "id" | "created_at">): Promise<BusinessServiceItem> {
    return { ...service, id: "", created_at: new Date().toISOString() };
  },

  async getBusinessPayments(businessId: string): Promise<BusinessPayment[]> {
    return [];
  },

  async getBusinessAnalytics(businessId: string): Promise<BusinessAnalytics> {
    return { total_revenue: 0, total_transactions: 0, average_transaction_value: 0, customer_count: 0, top_services: [], monthly_growth: 0 };
  },

  async getTillPayments(businessId: string): Promise<TillPayment[]> {
    return [];
  },

  async getPaybillPayments(businessId: string): Promise<PaybillPayment[]> {
    return [];
  },
};
