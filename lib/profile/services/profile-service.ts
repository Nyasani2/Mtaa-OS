import { supabase } from '@/lib/supabase';

export class ProfileService {
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return { data, error };
  }

  static async updateProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    return { data, error };
  }

  static async markNotificationRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .maybeSingle();
    return { data, error };
  }

  static async getAchievements(userId: string) {
    const { data, error } = await supabase
      .from('profile_achievements')
      .select('*')
      .eq('profile_id', userId)
      .order('earned_at', { ascending: false });
    if (error) { console.warn('[ProfileService.getAchievements] error:', error.message); return []; }
    return data || [];
  }

  static async getProfileStats(userId: string) {
    try {
      const [postsRes, followersRes, followingRes] = await Promise.all([
        supabase.from('streets_posts').select('id', { count: 'exact', head: true }).eq('creator_id', userId),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);
      return { postsCount: postsRes.count || 0, followersCount: followersRes.count || 0, followingCount: followingRes.count || 0 };
    } catch (e) {
      console.warn('[ProfileService.getProfileStats] error:', e);
      return { postsCount: 0, followersCount: 0, followingCount: 0 };
    }
  }

  // Batch 3 stubs
  async getMyProfile(): Promise<any> { return null; }
  async getPublicProfileSummary(profileId: string): Promise<any> { return null; }
  async updateProfile(updates: any): Promise<any> { return null; }
}

export default ProfileService;

// === AUTO-ADDED INSTANCE EXPORTS ===
export const profileService = new ProfileService();
export const profileRoleService = profileService;
export const profileVerificationService = profileService;
export const profileReputationService = profileService;
export const profileAchievementService = profileService;
export const profilePortfolioService = profileService;
export const profileSkillService = profileService;
export const profileCertificationService = profileService;
export const profileConnectionService = profileService;
export const profileSettingsService = profileService;
export const profileAnalyticsService = profileService;
