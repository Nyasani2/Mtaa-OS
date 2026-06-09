// ============================================================================
// MTAA Profile OS — Profile Service Layer
// CRUD operations for core profile data, roles, verifications, reputation
// ============================================================================

import { supabase } from '@/lib/supabase';
import type {
  Profile, ProfileRole, ProfileVerification, ProfileReputation,
  ProfileAchievement, ProfilePortfolio, ProfileProject, ProfileSkill,
  ProfileCertification, ProfileReference, ProfileLink, ProfileConnection,
  ProfileQRCode, ProfileAnalytics, ProfileSettings, ProfileActivity,
  PublicProfileSummary, ProfileType, VerificationType, VerificationStatus,
  AchievementType, PortfolioType, ConnectionType
} from '../types';

// ── Auth helper ─────────────────────────────────────────────────────────────
async function getSessionToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

// ════════════════════════════════════════════════════════════════════════════
// 1. CORE PROFILE SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileService = {
  /** Get current user's profile */
  async getMyProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data as Profile;
  },

  /** Get any profile by ID (public) */
  async getProfileById(profileId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('is_public', true)
      .single();

    if (error) return null;
    return data as Profile;
  },

  /** Get public profile summary (uses SQL function) */
  async getPublicProfileSummary(profileId: string): Promise<PublicProfileSummary | null> {
    const { data, error } = await supabase
      .rpc('get_public_profile', { p_id: profileId });

    if (error) throw error;
    return data as PublicProfileSummary;
  },

  /** Update current user's profile */
  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  /** Search profiles by query (full-text search) */
  async searchProfiles(query: string, limit: number = 20): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .textSearch('search_vector', query)
      .eq('is_public', true)
      .limit(limit);

    if (error) throw error;
    return (data || []) as Profile[];
  },

  /** Upload avatar */
  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-media')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-media')
      .getPublicUrl(filePath);

    await this.updateProfile({ avatar_url: publicUrl });
    return publicUrl;
  },

  /** Upload cover photo */
  async uploadCoverPhoto(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const filePath = `covers/${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-media')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-media')
      .getPublicUrl(filePath);

    await this.updateProfile({ cover_photo_url: publicUrl });
    return publicUrl;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. PROFILE ROLES SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileRoleService = {
  /** Get all roles for current user */
  async getMyRoles(): Promise<ProfileRole[]> {
    const profile = await profileService.getMyProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('profile_roles')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('is_active', true);

    if (error) throw error;
    return (data || []) as ProfileRole[];
  },

  /** Add a role to current user */
  async addRole(roleType: ProfileType, isPrimary: boolean = false): Promise<ProfileRole> {
    const profile = await profileService.getMyProfile();
    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('profile_roles')
      .upsert({
        profile_id: profile.id,
        role_type: roleType,
        is_active: true,
        is_primary: isPrimary,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProfileRole;
  },

  /** Deactivate a role */
  async deactivateRole(roleId: string): Promise<void> {
    const { error } = await supabase
      .from('profile_roles')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('id', roleId);

    if (error) throw error;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 3. PROFILE VERIFICATIONS SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileVerificationService = {
  /** Get all verifications for current user */
  async getMyVerifications(): Promise<ProfileVerification[]> {
    const profile = await profileService.getMyProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('profile_verifications')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProfileVerification[];
  },

  /** Submit a new verification request */
  async submitVerification(
    verificationType: VerificationType,
    documents: any[],
    notes?: string
  ): Promise<ProfileVerification> {
    const profile = await profileService.getMyProfile();
    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('profile_verifications')
      .insert({
        profile_id: profile.id,
        verification_type: verificationType,
        status: 'pending',
        documents,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProfileVerification;
  },

  /** Check verification status */
  async getVerificationStatus(verificationType: VerificationType): Promise<VerificationStatus | null> {
    const profile = await profileService.getMyProfile();
    if (!profile) return null;

    const { data, error } = await supabase
      .from('profile_verifications')
      .select('status')
      .eq('profile_id', profile.id)
      .eq('verification_type', verificationType)
      .in('status', ['pending', 'in_review', 'approved'])
      .single();

    if (error) return null;
    return data?.status as VerificationStatus || null;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 4. PROFILE REPUTATION SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileReputationService = {
  /** Get current user's reputation */
  async getMyReputation(): Promise<ProfileReputation | null> {
    const profile = await profileService.getMyProfile();
    if (!profile) return null;

    const { data, error } = await supabase
      .from('profile_reputation')
      .select('*')
      .eq('profile_id', profile.id)
      .single();

    if (error) return null;
    return data as ProfileReputation;
  },

  /** Get any user's reputation (public) */
  async getReputationByProfileId(profileId: string): Promise<ProfileReputation | null> {
    const { data, error } = await supabase
      .from('profile_reputation')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error) return null;
    return data as ProfileReputation;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5. PROFILE ACHIEVEMENTS SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileAchievementService = {
  /** Get achievements for a profile */
  async getAchievements(profileId: string): Promise<ProfileAchievement[]> {
    const { data, error } = await supabase
      .from('profile_achievements')
      .select('*')
      .eq('profile_id', profileId)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return (data || []) as ProfileAchievement[];
  },

  /** Add achievement to current user */
  async addAchievement(achievement: Partial<ProfileAchievement>): Promise<ProfileAchievement> {
    const profile = await profileService.getMyProfile();
    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('profile_achievements')
      .insert({ ...achievement, profile_id: profile.id })
      .select()
      .single();

    if (error) throw error;
    return data as ProfileAchievement;
  },

  /** Delete achievement */
  async deleteAchievement(achievementId: string): Promise<void> {
    const { error } = await supabase
      .from('profile_achievements')
      .delete()
      .eq('id', achievementId);

    if (error) throw error;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 6. PROFILE PORTFOLIO SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profilePortfolioService = {
  /** Get portfolios for a profile */
  async getPortfolios(profileId: string): Promise<ProfilePortfolio[]> {
    const { data, error } = await supabase
      .from('profile_portfolios')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProfilePortfolio[];
  },

  /** Get my portfolios (including private) */
  async getMyPortfolios(): Promise<ProfilePortfolio[]> {
    const profile = await profileService.getMyProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('profile_portfolios')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProfilePortfolio[];
  },

  /** Create portfolio item */
  async createPortfolio(portfolio: Partial<ProfilePortfolio>): Promise<ProfilePortfolio> {
    const profile = await profileService.getMyProfile();
    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('profile_portfolios')
      .insert({ ...portfolio, profile_id: profile.id })
      .select()
      .single();

    if (error) throw error;
    return data as ProfilePortfolio;
  },

  /** Update portfolio */
  async updatePortfolio(portfolioId: string, updates: Partial<ProfilePortfolio>): Promise<ProfilePortfolio> {
    const { data, error } = await supabase
      .from('profile_portfolios')
      .update(updates)
      .eq('id', portfolioId)
      .select()
      .single();

    if (error) throw error;
    return data as ProfilePortfolio;
  },

  /** Delete portfolio */
  async deletePortfolio(portfolioId: string): Promise<void> {
    const { error } = await supabase
      .from('profile_portfolios')
      .delete()
      .eq('id', portfolioId);

    if (error) throw error;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 7. PROFILE SKILLS SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileSkillService = {
  /** Get skills for a profile */
  async getSkills(profileId: string): Promise<ProfileSkill[]> {
    const { data, error } = await supabase
      .from('profile_skills')
      .select('*')
      .eq('profile_id', profileId)
      .order('endorsement_count', { ascending: false });

    if (error) throw error;
    return (data || []) as ProfileSkill[];
  },

  /** Add skill to current user */
  async addSkill(skill: Partial<ProfileSkill>): Promise<ProfileSkill> {
    const profile = await profileService.getMyProfile();
    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('profile_skills')
      .insert({ ...skill, profile_id: profile.id })
      .select()
      .single();

    if (error) throw error;
    return data as ProfileSkill;
  },

  /** Endorse a skill */
  async endorseSkill(skillId: string): Promise<void> {
    const profile = await profileService.getMyProfile();
    if (!profile) throw new Error('Profile not found');

    const { data: skill } = await supabase
      .from('profile_skills')
      .select('endorsed_by, endorsement_count')
      .eq('id', skillId)
      .single();

    if (!skill) throw new Error('Skill not found');

    const endorsedBy = skill.endorsed_by || [];
    if (endorsedBy.includes(profile.id)) return; // Already endorsed

    const { error } = await supabase
      .from('profile_skills')
      .update({
        endorsed_by: [...endorsedBy, profile.id],
        endorsement_count: (skill.endorsement_count || 0) + 1,
      })
      .eq('id', skillId);

    if (error) throw error;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 8. PROFILE CERTIFICATIONS SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileCertificationService = {
  /** Get certifications for a profile */
  async getCertifications(profileId: string): Promise<ProfileCertification[]> {
    const { data, error } = await supabase
      .from('profile_certifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return (data || []) as ProfileCertification[];
  },

  /** Add certification */
  async addCertification(cert: Partial<ProfileCertification>): Promise<ProfileCertification> {
    const profile = await profileService.getMyProfile();
    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('profile_certifications')
      .insert({ ...cert, profile_id: profile.id })
      .select()
      .single();

    if (error) throw error;
    return data as ProfileCertification;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 9. PROFILE CONNECTIONS SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileConnectionService = {
  /** Get my connections */
  async getMyConnections(): Promise<ProfileConnection[]> {
    const profile = await profileService.getMyProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('profile_connections')
      .select('*')
      .or(`profile_id.eq.${profile.id},connected_profile_id.eq.${profile.id}`)
      .eq('status', 'active');

    if (error) throw error;
    return (data || []) as ProfileConnection[];
  },

  /** Send connection request */
  async connect(profileId: string, type: ConnectionType = 'contact'): Promise<ProfileConnection> {
    const myProfile = await profileService.getMyProfile();
    if (!myProfile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('profile_connections')
      .upsert({
        profile_id: myProfile.id,
        connected_profile_id: profileId,
        connection_type: type,
        status: 'pending',
        initiated_by: myProfile.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProfileConnection;
  },

  /** Accept connection */
  async acceptConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('profile_connections')
      .update({ status: 'active' })
      .eq('id', connectionId);

    if (error) throw error;
  },

  /** Remove/block connection */
  async removeConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('profile_connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 10. PROFILE SETTINGS SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileSettingsService = {
  /** Get current user's settings */
  async getMySettings(): Promise<ProfileSettings | null> {
    const profile = await profileService.getMyProfile();
    if (!profile) return null;

    const { data, error } = await supabase
      .from('profile_settings')
      .select('*')
      .eq('profile_id', profile.id)
      .single();

    if (error) return null;
    return data as ProfileSettings;
  },

  /** Update settings */
  async updateSettings(updates: Partial<ProfileSettings>): Promise<ProfileSettings> {
    const profile = await profileService.getMyProfile();
    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('profile_settings')
      .update(updates)
      .eq('profile_id', profile.id)
      .select()
      .single();

    if (error) throw error;
    return data as ProfileSettings;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 11. PROFILE ANALYTICS SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const profileAnalyticsService = {
  /** Get analytics for current user */
  async getMyAnalytics(days: number = 30): Promise<ProfileAnalytics[]> {
    const profile = await profileService.getMyProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('profile_analytics')
      .select('*')
      .eq('profile_id', profile.id)
      .gte('date', new Date(Date.now() - days * 86400000).toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as ProfileAnalytics[];
  },

  /** Record a profile view (called when someone views a profile) */
  async recordProfileView(profileId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .rpc('increment_profile_views', {
        p_profile_id: profileId,
        p_date: today,
      });

    if (error) {
      // Fallback: upsert manually if RPC doesn't exist
      const { error: upsertError } = await supabase
        .from('profile_analytics')
        .upsert({
          profile_id: profileId,
          date: today,
          profile_views: 1,
        }, { onConflict: 'profile_id,date' });

      if (upsertError) throw upsertError;
    }
  },
};
