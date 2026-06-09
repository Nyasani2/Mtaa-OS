// ============================================================================
// MTAA Profile OS — Types
// All TypeScript types for Profile, Business, Portfolio, Network, Analytics
// ============================================================================

import type { Database } from '@/lib/supabase';

// ── Enums (mirroring SQL enums) ──────────────────────────────────────────────

export type ProfileType =
  | 'personal' | 'professional' | 'business' | 'creator' | 'merchant'
  | 'agent' | 'developer' | 'farmer' | 'service_provider' | 'community_leader'
  | 'tribe_elder' | 'ngo' | 'institution' | 'school' | 'hospital'
  | 'government' | 'county';

export type BusinessType =
  | 'restaurant' | 'shop' | 'service' | 'taxi' | 'truck' | 'agency'
  | 'store' | 'brand' | 'company' | 'cooperative' | 'hotel' | 'clinic'
  | 'pharmacy' | 'supermarket' | 'butchery' | 'bakery' | 'bar' | 'cafe';

export type BusinessStatus = 'draft' | 'pending' | 'active' | 'suspended' | 'closed' | 'under_review';

export type VerificationType = 'identity' | 'address' | 'business' | 'professional' | 'community' | 'government' | 'phone' | 'email' | 'biometric';

export type VerificationStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired' | 'revoked';

export type AchievementType = 'award' | 'certificate' | 'license' | 'milestone' | 'recognition' | 'completion' | 'badge' | 'ranking';

export type PortfolioType =
  | 'project' | 'case_study' | 'photo' | 'video' | 'document'
  | 'presentation' | 'research' | 'product' | 'business' | 'service'
  | 'event' | 'community_project' | 'article' | 'podcast' | 'livestream';

export type ConnectionType = 'follower' | 'following' | 'contact' | 'client' | 'supplier' | 'partner' | 'colleague' | 'mentor' | 'mentee';

export type StaffRole = 'owner' | 'manager' | 'admin' | 'cashier' | 'waiter' | 'chef' | 'driver' | 'dispatcher' | 'agent' | 'staff' | 'supervisor' | 'accountant' | 'marketing' | 'support';

export type StaffStatus = 'active' | 'inactive' | 'suspended' | 'terminated' | 'on_leave';

export type AvailabilityStatus = 'available' | 'busy' | 'away' | 'offline' | 'do_not_disturb' | 'open_to_work' | 'hiring' | 'open_for_business';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// ── Core Profile ─────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  id_number: string | null;
  id_type: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  country: string;
  postal_code: string | null;
  geo_location: Record<string, any> | null;
  occupation: string | null;
  employer: string | null;
  income_range: string | null;
  is_verified: boolean;
  verification_level: number;
  kyc_status: string;
  trust_score: number;
  role: string;
  metadata: Record<string, any>;
  last_active_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  // Extended fields
  bio: string | null;
  short_bio: string | null;
  mission: string | null;
  vision: string | null;
  skills: string[] | null;
  languages: string[] | null;
  availability_status: AvailabilityStatus;
  profession: string | null;
  specialties: string[] | null;
  interests: string[] | null;
  website_url: string | null;
  social_links: Record<string, any>;
  profile_type: ProfileType;
  headline: string | null;
  years_of_experience: number | null;
  education_level: string | null;
  is_public: boolean;
  allow_messages: boolean;
  allow_calls: boolean;
  profile_completeness: number;
}

// ── Profile Roles ────────────────────────────────────────────────────────────

export interface ProfileRole {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  role_type: ProfileType;
  is_active: boolean;
  is_primary: boolean;
  started_at: string | null;
  ended_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  metadata: Record<string, any>;
}

// ── Profile Verifications ────────────────────────────────────────────────────

export interface ProfileVerification {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  expiry_date: string | null;
  documents: any[];
  notes: string | null;
  metadata: Record<string, any>;
}

// ── Profile Reputation ─────────────────────────────────────────────────────

export interface ProfileReputation {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  overall_score: number;
  verification_score: number;
  activity_score: number;
  business_score: number;
  community_score: number;
  job_score: number;
  service_score: number;
  reliability_score: number;
  trust_score: number;
  completed_jobs: number;
  completed_orders: number;
  positive_reviews: number;
  negative_reviews: number;
  neutral_reviews: number;
  dispute_count: number;
  dispute_resolved: number;
  metadata: Record<string, any>;
}

// ── Profile Achievements ─────────────────────────────────────────────────────

export interface ProfileAchievement {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  achievement_type: AchievementType;
  title: string;
  description: string | null;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  verification_url: string | null;
  document_url: string | null;
  badge_image_url: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  metadata: Record<string, any>;
  visibility: 'public' | 'connections' | 'private';
}

// ── Profile Portfolio ────────────────────────────────────────────────────────

export interface ProfilePortfolio {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  portfolio_type: PortfolioType;
  title: string;
  description: string | null;
  category: string | null;
  media_urls: string[] | null;
  thumbnail_url: string | null;
  external_links: any[];
  tags: string[] | null;
  start_date: string | null;
  end_date: string | null;
  is_featured: boolean;
  is_public: boolean;
  view_count: number;
  like_count: number;
  metadata: Record<string, any>;
}

// ── Profile Project ────────────────────────────────────────────────────────────

export interface ProfileProject {
  id: string;
  created_at: string;
  updated_at: string;
  portfolio_id: string | null;
  profile_id: string;
  title: string;
  description: string | null;
  role: string | null;
  client_name: string | null;
  client_url: string | null;
  technologies: string[] | null;
  outcomes: string | null;
  metrics: Record<string, any>;
  start_date: string | null;
  end_date: string | null;
  is_ongoing: boolean;
  metadata: Record<string, any>;
}

// ── Profile Skills ─────────────────────────────────────────────────────────────

export interface ProfileSkill {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  skill_name: string;
  proficiency_level: SkillLevel;
  years_of_experience: number | null;
  is_verified: boolean;
  endorsed_by: string[];
  endorsement_count: number;
  category: string | null;
  metadata: Record<string, any>;
}

// ── Profile Certifications ─────────────────────────────────────────────────────

export interface ProfileCertification {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  document_url: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  skills: string[] | null;
  metadata: Record<string, any>;
}

// ── Profile References ─────────────────────────────────────────────────────────

export interface ProfileReference {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  referrer_profile_id: string;
  relationship: string;
  recommendation: string;
  rating: number | null;
  is_public: boolean;
  is_verified: boolean;
  metadata: Record<string, any>;
}

// ── Profile Links ──────────────────────────────────────────────────────────────

export interface ProfileLink {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  platform: string;
  url: string;
  title: string | null;
  is_verified: boolean;
  is_primary: boolean;
  metadata: Record<string, any>;
}

// ── Profile Connections ──────────────────────────────────────────────────────

export interface ProfileConnection {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  connected_profile_id: string;
  connection_type: ConnectionType;
  status: 'pending' | 'active' | 'blocked' | 'removed';
  initiated_by: string;
  notes: string | null;
  metadata: Record<string, any>;
}

// ── Profile QR Codes ───────────────────────────────────────────────────────────

export interface ProfileQRCode {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  qr_type: 'identity' | 'contact' | 'business' | 'portfolio' | 'payment' | 'job' | 'service';
  qr_data: string;
  qr_image_url: string | null;
  is_active: boolean;
  expires_at: string | null;
  scan_count: number;
  metadata: Record<string, any>;
}

// ── Profile Analytics ──────────────────────────────────────────────────────────

export interface ProfileAnalytics {
  id: string;
  created_at: string;
  date: string;
  profile_id: string;
  profile_views: number;
  portfolio_views: number;
  business_views: number;
  service_views: number;
  product_views: number;
  job_invitations: number;
  service_requests: number;
  product_sales: number;
  community_reach: number;
  revenue_generated: number;
  new_followers: number;
  new_connections: number;
  metadata: Record<string, any>;
}

// ── Profile Settings ─────────────────────────────────────────────────────────

export interface ProfileSettings {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  is_profile_public: boolean;
  is_portfolio_public: boolean;
  is_achievements_public: boolean;
  is_skills_public: boolean;
  allow_messages_from: 'all' | 'connections' | 'none';
  allow_calls_from: 'all' | 'connections' | 'none';
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
  show_online_status: boolean;
  email_notifications: Record<string, boolean>;
  push_notifications: Record<string, boolean>;
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  blocked_profiles: string[];
  metadata: Record<string, any>;
}

// ── Business ───────────────────────────────────────────────────────────────────

export interface Business {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  name: string;
  business_type: BusinessType | null;
  status: BusinessStatus;
  tax_pin: string | null;
  registration_number: string | null;
  licenses: any[];
  operating_hours: Record<string, any>;
  compliance_docs: any[];
  cuisine_type: string | null;
  year_established: number | null;
  employee_count: number | null;
  website: string | null;
  social_media: Record<string, any>;
  amenities: string[] | null;
  payment_methods: string[];
  delivery_available: boolean;
  delivery_radius: number | null;
  minimum_order: number | null;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  short_description: string | null;
  is_featured: boolean;
  featured_until: string | null;
  review_count: number;
  average_rating: number;
  metadata: Record<string, any>;
}

// ── Business Branch ────────────────────────────────────────────────────────────

export interface BusinessBranch {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  name: string;
  is_main_branch: boolean;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  country: string;
  postal_code: string | null;
  geo_location: Record<string, any> | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  operating_hours: Record<string, any>;
  is_active: boolean;
  metadata: Record<string, any>;
}

// ── Profile Business Junction ──────────────────────────────────────────────────

export interface ProfileBusiness {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  business_id: string;
  role: StaffRole;
  is_primary_owner: boolean;
  permissions: Record<string, any>;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
}

// ── Business Staff ─────────────────────────────────────────────────────────────

export interface BusinessStaff {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  branch_id: string | null;
  profile_id: string;
  role: StaffRole;
  status: StaffStatus;
  permissions: Record<string, any>;
  hourly_rate: number | null;
  salary: number | null;
  commission_rate: number | null;
  start_date: string | null;
  end_date: string | null;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  metadata: Record<string, any>;
}

// ── Composite Types ────────────────────────────────────────────────────────────

export interface PublicProfileSummary {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  bio: string | null;
  profession: string | null;
  city: string | null;
  country: string | null;
  skills: string[] | null;
  languages: string[] | null;
  is_verified: boolean;
  verification_level: number;
  trust_score: number;
  profile_completeness: number;
  availability_status: AvailabilityStatus;
  roles: ProfileType[] | null;
  reputation: {
    overall_score: number;
    trust_score: number;
    business_score: number;
    community_score: number;
  } | null;
  portfolio_count: number;
  achievement_count: number;
  business_count: number;
  connection_count: number;
}

export interface ProfileActivity {
  id: string;
  created_at: string;
  profile_id: string;
  activity_type: string;
  activity_description: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
}
