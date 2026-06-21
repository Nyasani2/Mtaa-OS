// MTAA Identity Engine — Shared Types
// Every module reads from this identity model

export interface MTAAIdentity {
  // Core Identity
  user_id: string;
  email: string;
  phone?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  country?: string;
  county?: string;
  town?: string;
  date_joined: string;
  verification_status: 'unverified' | 'pending' | 'verified' | 'premium';
  isLoading: boolean;
}

export interface MTAAWallet {
  balance: number;
  currency: string;
  escrow_balance: number;
  savings_balance: number;
  credit_score: number;
  pending_in: number;
  pending_out: number;
  last_transaction?: string;
  isLoading: boolean;
}

export interface MTAAProfessional {
  has_profile: boolean;
  headline?: string;
  summary?: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  certificates: Certificate[];
  portfolio: PortfolioItem[];
  references: Reference[];
  availability: 'available' | 'busy' | 'open';
  expected_salary?: number;
  salary_currency?: string;
  isLoading: boolean;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date?: string;
  current: boolean;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  verified: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  type: 'image' | 'video' | 'link' | 'document';
}

export interface Reference {
  id: string;
  name: string;
  role: string;
  company: string;
  phone?: string;
  email?: string;
  verified: boolean;
}

export interface MTAABusiness {
  has_profile: boolean;
  business_name?: string;
  description?: string;
  category?: string;
  logo_url?: string;
  products_count: number;
  services_count: number;
  employees_count: number;
  branches_count: number;
  revenue_stats?: RevenueStats;
  orders_count: number;
  rating: number;
  isLoading: boolean;
}

export interface RevenueStats {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export interface MTAAFamily {
  is_parent: boolean;
  children: ChildProfile[];
  isLoading: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  avatar_url?: string;
  date_of_birth?: string;
  school?: string;
  grade?: string;
  medical_notes?: string;
  transport_allowed: boolean;
  allowance_balance: number;
  education_progress?: EducationProgress;
}

export interface EducationProgress {
  current_term: string;
  attendance_rate: number;
  average_grade: string;
  subjects: string[];
}

export interface MTAACreator {
  has_profile: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  videos_count: number;
  articles_count: number;
  total_views: number;
  total_earnings: number;
  tips_received: number;
  subscriptions_count: number;
  isLoading: boolean;
}

export interface MTAAReputation {
  overall_rating: number;
  total_reviews: number;
  breakdown: AppRating[];
  isLoading: boolean;
}

export interface AppRating {
  app: string;
  rating: number;
  count: number;
  label: string;
}

export interface MTAADocument {
  id: string;
  type: DocumentType;
  name: string;
  url?: string;
  verified: boolean;
  uploaded_at: string;
  expires_at?: string;
}

export type DocumentType = 
  | 'national_id' | 'passport' | 'driving_license'
  | 'certificate' | 'contract' | 'land_title'
  | 'business_license' | 'insurance' | 'other';

export interface MTAAAsset {
  id: string;
  type: AssetType;
  name: string;
  description?: string;
  value?: number;
  currency?: string;
  details: Record<string, any>;
  documents: string[];
}

export type AssetType = 'vehicle' | 'property' | 'land' | 'equipment' | 'business';

export interface MTAAQRIdentity {
  qr_data: string;
  qr_url: string;
  actions: QRAction[];
}

export interface QRAction {
  type: 'profile' | 'pay' | 'hire' | 'message' | 'follow' | 'business' | 'cv';
  label: string;
  enabled: boolean;
}

export interface IdentityEngineState {
  identity: MTAAIdentity;
  wallet: MTAAWallet;
  professional: MTAAProfessional;
  business: MTAABusiness;
  family: MTAAFamily;
  creator: MTAACreator;
  reputation: MTAAReputation;
  documents: MTAADocument[];
  assets: MTAAAsset[];
  qr: MTAAQRIdentity;
  isLoading: boolean;
  error: string | null;
}
