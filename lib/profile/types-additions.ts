// Append to lib/profile/types.ts
export type ProfileType = 'personal' | 'business' | 'creator' | 'government';
export type VerificationType = 'government_id' | 'phone' | 'email' | 'biometric' | 'address';
export type ConnectionType = 'friend' | 'follower' | 'business' | 'mentor';
export type StaffRole = 'owner' | 'admin' | 'manager' | 'staff' | 'intern';
export type BusinessType = 'shop' | 'restaurant' | 'service' | 'retail' | 'wholesale' | 'manufacturing';
export type BusinessStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export interface ProfileAchievement { id: string; profile_id: string; title: string; description?: string; icon?: string; earned_at: string; metadata?: Record<string, any>; }
export interface ProfilePortfolio { id: string; profile_id: string; title: string; description?: string; media_url?: string; link?: string; created_at: string; }
export interface ProfileSkill { id: string; profile_id: string; skill_name: string; proficiency_level?: number; endorsed_count?: number; created_at: string; }
export interface ProfileCertification { id: string; profile_id: string; title: string; issuer?: string; issue_date?: string; expiry_date?: string; credential_url?: string; created_at: string; }
export interface Business { id: string; owner_id: string; name: string; type: BusinessType; status: BusinessStatus; description?: string; logo_url?: string; cover_image_url?: string; location?: string; contact_email?: string; contact_phone?: string; website?: string; created_at: string; updated_at: string; }
export interface BusinessBranch { id: string; business_id: string; name: string; location?: string; manager_id?: string; status: BusinessStatus; created_at: string; }
export interface BusinessStaff { id: string; business_id: string; user_id: string; role: StaffRole; status: StaffStatus; joined_at: string; }
export interface PublicProfileSummary { id: string; user_id: string; display_name?: string; username?: string; avatar_url?: string; bio?: string; profile_type: ProfileType; verification_status?: string; follower_count?: number; following_count?: number; created_at: string; }
export interface ProfileRole { id: string; profile_id: string; role: string; permissions: string[]; granted_at: string; }
export interface ProfileVerification { id: string; profile_id: string; type: VerificationType; status: 'pending' | 'verified' | 'rejected'; verified_at?: string; metadata?: Record<string, any>; }
export interface ProfileReputation { id: string; profile_id: string; score: number; total_reviews: number; positive_reviews: number; negative_reviews: number; created_at: string; updated_at: string; }
export interface ProfileConnection { id: string; requester_id: string; recipient_id: string; type: ConnectionType; status: 'pending' | 'accepted' | 'rejected' | 'blocked'; created_at: string; }
export interface ProfileSettings { id: string; profile_id: string; theme?: 'light' | 'dark' | 'system'; language?: string; notifications_enabled?: boolean; privacy_level?: 'public' | 'friends' | 'private'; created_at: string; updated_at: string; }
export interface ProfileAnalytics { id: string; profile_id: string; views_count: number; search_appearances: number; qr_scans: number; period_start: string; period_end: string; }
