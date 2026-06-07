// Wallet V2 Shared Types
// Used across all wallet modules: banking, gofund, savings, sacco, insurance, government, partner ecosystem

export interface WalletPartnerApplication {
  id: string;
  partner_category: 'banking' | 'insurance' | 'government' | 'healthcare' | 'education' | 'retail' | 'transport' | 'technology' | 'agriculture';
  partner_type: string;
  organization_name: string;
  registration_number?: string;
  country: string;
  city?: string;
  contact_name?: string;
  contact_email: string;
  contact_phone: string;
  website?: string;
  services_offered?: string[];
  description?: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'on_hold';
  submitted_by: string;
  reviewed_by?: string;
  submitted_at: string;
  reviewed_at?: string;
  review_notes?: string;
  estimated_premium_min?: number;
  estimated_premium_max?: number;
  target_market?: string;
  jurisdiction?: string;
  department?: string;
  authorization_level?: number;
}

export interface GoFundCampaign {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  currency: string;
  category: 'medical' | 'education' | 'business' | 'community' | 'emergency' | 'creative' | 'charity' | 'other';
  image_url?: string;
  creator_id: string;
  creator_name: string;
  status: 'active' | 'completed' | 'cancelled';
  end_date: string;
  created_at: string;
}

export interface GoFundContribution {
  id: string;
  campaign_id: string;
  contributor_id?: string;
  contributor_name: string;
  amount: number;
  currency: string;
  is_anonymous: boolean;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface GoFundUpdate {
  id: string;
  campaign_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  goal_type: 'personal' | 'group';
  status: 'active' | 'completed' | 'cancelled';
  end_date: string;
  created_by: string;
  created_at: string;
}

export interface SavingsContribution {
  id: string;
  goal_id: string;
  contributor_id: string;
  contributor_name: string;
  amount: number;
  currency: string;
  created_at: string;
}

export interface SavingsMember {
  id: string;
  goal_id: string;
  user_id: string;
  member_name: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface SACCO {
  id: string;
  name: string;
  registration_number?: string;
  country: string;
  city?: string;
  member_count: number;
  total_contributions: number;
  interest_rate: number;
  status: 'pending' | 'approved' | 'rejected';
  contact_email: string;
  contact_phone?: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface SACCOMembership {
  id: string;
  sacco_id: string;
  user_id: string;
  member_number: string;
  role: 'admin' | 'member';
  total_contributed: number;
  joined_at: string;
}

export interface SACCOContribution {
  id: string;
  sacco_id: string;
  contributor_id: string;
  contributor_name: string;
  amount: number;
  currency: string;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw' | 'escrow' | 'qr' | 'savings' | 'gofund' | 'sacco';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  recipient_name?: string;
  sender_name?: string;
  created_at: string;
}

export interface WalletNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}
