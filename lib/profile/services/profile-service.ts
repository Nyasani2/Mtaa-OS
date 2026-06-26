import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface ProfileStats {
  profile_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  follower_count: number | null;
  following_count: number | null;
  trust_score: number | null;
  completion_percentage: number | null;
  online_status: string | null;
  total_views: number;
  total_tips: number;
  total_subscribers: number;
  is_blocked_by_me: boolean;
  is_following_me: boolean;
}

export class ProfileService {
  // ── Get my profile (from auth.uid) ──────────────────────────────────────
  static async getMyProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  // ── Get profile by profiles.id (UUID) ───────────────────────────────────
  static async getProfileById(profileId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return data;
  }

  // ── Get profile by username/slug ──────────────────────────────────────────
  static async getProfileBySlug(slug: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`slug.eq.${slug},username.eq.${slug}`)
      .single();

    if (error) throw error;
    return data;
  }

  // ── Search profiles ─────────────────────────────────────────────────────
  static async searchProfiles(query: string, limit = 20): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ── Update my profile ───────────────────────────────────────────────────
  static async updateProfile(profileId: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ── Get profile stats (via RPC) ─────────────────────────────────────────
  static async getProfileStats(profileId: string): Promise<ProfileStats> {
    const { data, error } = await supabase
      .rpc('get_profile_stats', { p_profile_id: profileId });

    if (error) throw error;
    return data as ProfileStats;
  }

  // ── Get connections (followers/following) ───────────────────────────────
  static async getFollowers(profileId: string, limit = 50): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profile_connections')
      .select('profile_id, profiles!profile_connections_profile_id_fkey(*)')
      .eq('connected_profile_id', profileId)
      .eq('connection_type', 'follow')
      .eq('status', 'active')
      .limit(limit);

    if (error) throw error;
    return (data as any[])?.map(d => d.profiles) || [];
  }

  static async getFollowing(profileId: string, limit = 50): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profile_connections')
      .select('connected_profile_id, profiles!profile_connections_connected_profile_id_fkey(*)')
      .eq('profile_id', profileId)
      .eq('connection_type', 'follow')
      .eq('status', 'active')
      .limit(limit);

    if (error) throw error;
    return (data as any[])?.map(d => d.profiles) || [];
  }

  // ── Block / Unblock ─────────────────────────────────────────────────────
  static async blockProfile(blockerProfileId: string, blockedProfileId: string, reason?: string) {
    const { error } = await supabase
      .from('profile_blocks')
      .insert({ blocker_profile_id: blockerProfileId, blocked_profile_id: blockedProfileId, reason });
    if (error) throw error;
  }

  static async unblockProfile(blockerProfileId: string, blockedProfileId: string) {
    const { error } = await supabase
      .from('profile_blocks')
      .delete()
      .eq('blocker_profile_id', blockerProfileId)
      .eq('blocked_profile_id', blockedProfileId);
    if (error) throw error;
  }

  static async isBlocked(blockerProfileId: string, blockedProfileId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profile_blocks')
      .select('id')
      .eq('blocker_profile_id', blockerProfileId)
      .eq('blocked_profile_id', blockedProfileId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  // ── Report ──────────────────────────────────────────────────────────────
  static async reportProfile(reporterProfileId: string, reportedProfileId: string, reportType: string, description?: string) {
    const { error } = await supabase
      .from('profile_reports')
      .insert({ reporter_profile_id: reporterProfileId, reported_profile_id: reportedProfileId, report_type: reportType, description });
    if (error) throw error;
  }

  // ── Tip ─────────────────────────────────────────────────────────────────
  static async sendTip(senderProfileId: string, recipientProfileId: string, amount: number, currency = 'USD', message?: string) {
    const { error } = await supabase
      .from('profile_tips')
      .insert({ sender_profile_id: senderProfileId, recipient_profile_id: recipientProfileId, amount, currency, message });
    if (error) throw error;
  }

  // ── Subscribe ───────────────────────────────────────────────────────────
  static async subscribe(subscriberProfileId: string, creatorProfileId: string, tier: string, price: number, interval: string) {
    const { error } = await supabase
      .from('profile_subscriptions')
      .upsert({
        subscriber_profile_id: subscriberProfileId,
        creator_profile_id: creatorProfileId,
        tier, price, interval,
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'subscriber_profile_id,creator_profile_id' });
    if (error) throw error;
  }

  // ── Log profile view ──────────────────────────────────────────────────────
  static async logView(profileId: string, viewerProfileId?: string, source = 'direct') {
    const { error } = await supabase
      .from('profile_views')
      .insert({ profile_id: profileId, viewer_profile_id: viewerProfileId || null, source });
    if (error) console.warn('View log error:', error);
  }
}
