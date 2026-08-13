export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  languages: string[] | null;
  verified: boolean;
  verification_level: string;
  profile_completeness: number;
  created_at: string;
  updated_at: string;
  completeness?: number;
}

export interface ProfileRole {
  id: string;
  profile_id: string;
  role_type: string;
  is_active: boolean;
  created_at: string;
}

export interface ProfileVerification {
  id: string;
  profile_id: string;
  type: string;
  status: string;
  documents: any;
  created_at: string;
  updated_at: string;
}

export interface ProfileReputation {
  id: string;
  profile_id: string;
  score: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileConnection {
  id: string;
  profile_id: string;
  connected_profile_id: string;
  type: string;
  status: string;
  created_at: string;
}

export interface ProfileAnalytics {
  id: string;
  profile_id: string;
  views: number;
  searches: number;
  clicks: number;
  period: string;
  created_at: string;
}

export interface ProfileSettings {
  id: string;
  profile_id: string;
  privacy_level: string;
  notifications_enabled: boolean;
  theme: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileAchievement {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface ProfilePortfolio {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  media_urls: string[];
  category: string;
  created_at: string;
}

export interface ProfileSkill {
  id: string;
  profile_id: string;
  name: string;
  level: string;
  endorsements: number;
  created_at: string;
}

export interface ProfileCertification {
  id: string;
  profile_id: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  credential_url: string | null;
  created_at: string;
}

export type BusinessType = 'sole_proprietorship' | 'partnership' | 'limited_company' | 'corporation' | 'cooperative' | 'ngo';
export type BusinessStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type StaffRole = 'owner' | 'admin' | 'manager' | 'staff' | 'intern';
export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type ConnectionType = 'contact' | 'friend' | 'business' | 'family';
