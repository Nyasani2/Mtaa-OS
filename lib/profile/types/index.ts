// lib/profile/types/index.ts
// FIXED v2: Added ALL missing types

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  profile_completeness?: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileType {
  id: string;
  name: string;
  description?: string;
}

export interface VerificationType {
  id: string;
  name: string;
  level: number;
}

export interface ConnectionType {
  id: string;
  name: string;
}

export interface StaffRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface ProfileAchievement {
  id: string;
  profile_id: string;
  title: string;
  description?: string;
  icon?: string;
  earned_at: string;
}

export interface ProfilePortfolio {
  id: string;
  profile_id: string;
  title: string;
  description?: string;
  url?: string;
  media_url?: string;
  created_at: string;
}

export interface ProfileSkill {
  id: string;
  profile_id: string;
  name: string;
  level?: string;
  endorsements?: number;
}

export interface ProfileCertification {
  id: string;
  profile_id: string;
  name: string;
  issuer?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_url?: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  type: BusinessType;
  status: BusinessStatus;
  description?: string;
  created_at: string;
}

export interface BusinessBranch {
  id: string;
  business_id: string;
  name: string;
  location?: string;
  phone?: string;
}

export interface BusinessStaff {
  id: string;
  business_id: string;
  user_id: string;
  role: StaffRole;
  status: StaffStatus;
  joined_at: string;
}

export interface ProfileBusiness {
  id: string;
  profile_id: string;
  business_id: string;
  role: string;
}

export type BusinessType = 'retail' | 'service' | 'manufacturing' | 'technology' | 'other';
export type BusinessStatus = 'active' | 'inactive' | 'pending_verification';
export type StaffStatus = 'active' | 'inactive' | 'suspended';

export interface PublicProfileSummary {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  is_verified: boolean;
}

export interface ProfileRole {
  id: string;
  profile_id: string;
  role: string;
  granted_at: string;
}

export interface ProfileVerification {
  id: string;
  profile_id: string;
  type: string;
  status: string;
  verified_at?: string;
}

export interface ProfileReputation {
  id: string;
  profile_id: string;
  score: number;
  reviews_count: number;
  updated_at: string;
}

export interface ProfileSettings {
  id: string;
  profile_id: string;
  theme?: string;
  language?: string;
  notifications_enabled?: boolean;
  privacy_level?: string;
}

export interface FollowRecord {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface BlockRecord {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface SubscriptionRecord {
  id: string;
  subscriber_id: string;
  creator_id: string;
  tier: string;
  status: string;
  created_at: string;
}

export interface TipRecord {
  id: string;
  sender_id: string;
  recipient_id: string;
  amount: number;
  message?: string;
  created_at: string;
}

export interface PostRecord {
  id: string;
  author_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface ListingRecord {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  points: number;
}

export interface DocumentRecord {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  url: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  profile_id: string;
  member_id: string;
  relationship: string;
  created_at: string;
}

export interface PrivacySettings {
  id: string;
  profile_id: string;
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
  allow_messages: boolean;
}


// === MERGED FROM types-additions.ts ===
export interface ProfileConnection { id: string; requester_id: string; recipient_id: string; type: ConnectionType; status: 'pending' | 'accepted' | 'rejected' | 'blocked'; created_at: string; }

export interface ProfileAnalytics { id: string; profile_id: string; views_count: number; search_appearances: number; qr_scans: number; period_start: string; period_end: string; }