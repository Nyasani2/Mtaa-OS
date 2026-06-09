// ============================================================================
// MTAA Profile OS — React Hooks Layer (FIXED)
// Bridges Zustand store to React components
// ============================================================================

import { useCallback, useEffect } from 'react';
import { useProfileStore } from '../state/profile-store';
import type {
  ProfileType, VerificationType, ConnectionType, StaffRole,
  ProfileAchievement, ProfilePortfolio, ProfileSkill, ProfileCertification,
  Business, BusinessBranch
} from '../types';

// ════════════════════════════════════════════════════════════════════════════
// 1. useProfile — Core profile operations (AUTO-LOAD ON MOUNT)
// ════════════════════════════════════════════════════════════════════════════

export function useProfile() {
  const store = useProfileStore();

  // AUTO-LOAD: Fetch profile on mount if not already loaded
  useEffect(() => {
    if (!store.profile && !store.isLoading) {
      store.loadProfile();
    }
  }, []); // Empty deps = run once on mount

  return {
    // Data
    profile: store.profile,
    isLoading: store.isLoading,
    isRefreshing: store.isRefreshing,
    error: store.error,

    // Actions
    loadProfile: store.loadProfile,
    updateProfile: store.updateProfile,
    refreshProfile: store.refreshAll,
    clearError: store.clearError,

    // Computed
    isAuthenticated: !!store.profile,
    profileCompleteness: store.profile?.profile_completeness || 0,
    displayName: store.profile?.display_name || store.profile?.full_name || 'Anonymous',
    avatarUrl: store.profile?.avatar_url,
    coverPhotoUrl: store.profile?.cover_photo_url,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 2. useProfileRoles — Role management
// ════════════════════════════════════════════════════════════════════════════

export function useProfileRoles() {
  const store = useProfileStore();

  useEffect(() => {
    if (store.profile && store.roles.length === 0) {
      store.loadRoles();
    }
  }, [store.profile, store.roles.length]);

  return {
    roles: store.roles,
    activeRoles: store.roles.filter(r => r.is_active),
    hasRole: useCallback((roleType: ProfileType) => {
      return store.roles.some(r => r.role_type === roleType && r.is_active);
    }, [store.roles]),
    addRole: store.addRole,
    loadRoles: store.loadRoles,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 3. useProfileVerifications — KYC/verification status
// ════════════════════════════════════════════════════════════════════════════

export function useProfileVerifications() {
  const store = useProfileStore();

  useEffect(() => {
    if (store.profile && store.verifications.length === 0) {
      store.loadVerifications();
    }
  }, [store.profile, store.verifications.length]);

  return {
    verifications: store.verifications,
    pendingVerifications: store.verifications.filter(v => v.status === 'pending'),
    approvedVerifications: store.verifications.filter(v => v.status === 'approved'),
    isVerified: store.verifications.some(v => v.status === 'approved'),
    submitVerification: store.submitVerification,
    loadVerifications: store.loadVerifications,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 4. useProfileReputation — Trust & reputation scores
// ════════════════════════════════════════════════════════════════════════════

export function useProfileReputation() {
  const store = useProfileStore();

  useEffect(() => {
    if (store.profile && !store.reputation) {
      store.loadReputation();
    }
  }, [store.profile, store.reputation]);

  return {
    reputation: store.reputation,
    overallScore: store.reputation?.overall_score || 0,
    trustScore: store.reputation?.trust_score || 0,
    businessScore: store.reputation?.business_score || 0,
    communityScore: store.reputation?.community_score || 0,
    loadReputation: store.loadReputation,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 5. useProfileAchievements — Awards, certs, milestones
// ════════════════════════════════════════════════════════════════════════════

export function useProfileAchievements() {
  const store = useProfileStore();

  useEffect(() => {
    if (store.profile && store.achievements.length === 0) {
      store.loadAchievements();
    }
  }, [store.profile, store.achievements.length]);

  return {
    achievements: store.achievements,
    achievementCount: store.achievements.length,
    addAchievement: store.addAchievement,
    loadAchievements: store.loadAchievements,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 6. useProfilePortfolio — Projects, case studies, media
// ════════════════════════════════════════════════════════════════════════════

export function useProfilePortfolio() {
  const store = useProfileStore();

  useEffect(() => {
    if (store.profile && store.portfolios.length === 0) {
      store.loadPortfolios();
    }
  }, [store.profile, store.portfolios.length]);

  return {
    portfolios: store.portfolios,
    featuredPortfolios: store.portfolios.filter(p => p.is_featured),
    portfolioCount: store.portfolios.length,
    createPortfolio: store.createPortfolio,
    loadPortfolios: store.loadPortfolios,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 7. useProfileSkills — Skills & endorsements
// ════════════════════════════════════════════════════════════════════════════

export function useProfileSkills() {
  const store = useProfileStore();

  useEffect(() => {
    if (store.profile && store.skills.length === 0) {
      store.loadSkills();
    }
  }, [store.profile, store.skills.length]);

  return {
    skills: store.skills,
    topSkills: store.skills.slice(0, 5),
    skillCount: store.skills.length,
    addSkill: store.addSkill,
    endorseSkill: store.endorseSkill,
    loadSkills: store.loadSkills,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 8. useProfileCertifications — Professional certs
// ════════════════════════════════════════════════════════════════════════════

export function useProfileCertifications() {
  const store = useProfileStore();

  useEffect(() => {
    if (store.profile && store.certifications.length === 0) {
      store.loadCertifications();
    }
  }, [store.profile, store.certifications.length]);

  return {
    certifications: store.certifications,
    validCertifications: store.certifications.filter(c =>
      !c.expiry_date || new Date(c.expiry_date) > new Date()
    ),
    expiredCertifications: store.certifications.filter(c =>
      c.expiry_date && new Date(c.expiry_date) <= new Date()
    ),
    addCertification: store.addCertification,
    loadCertifications: store.loadCertifications,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 9. useProfileNetwork — Connections, followers, following
// ════════════════════════════════════════════════════════════════════════════

export function useProfileNetwork() {
  const store = useProfileStore();

  useEffect(() => {
    if (store.profile && store.connections.length === 0) {
      store.loadConnections();
    }
  }, [store.profile, store.connections.length]);

  return {
    connections: store.connections,
    followers: store.connections.filter(c => c.connection_type === 'follower'),
    following: store.connections.filter(c => c.connection_type === 'following'),
    contacts: store.connections.filter(c => c.connection_type === 'contact'),
    connectionCount: store.connections.length,
    connect: store.connect,
    loadConnections: store.loadConnections,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 10. useProfileSettings — Privacy, notifications, preferences
// ════════════════════════════════════════════════════════════════════════════

export function useProfileSettings() {
  const store = useProfileStore();

  useEffect(() => {
    if (store.profile && !store.settings) {
      store.loadSettings();
    }
  }, [store.profile, store.settings]);

  return {
    settings: store.settings,
    isPublic: store.settings?.is_profile_public ?? true,
    allowMessages: store.settings?.allow_messages_from === 'all',
    theme: store.settings?.theme || 'system',
    language: store.settings?.language || 'en',
    updateSettings: store.updateSettings,
    loadSettings: store.loadSettings,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 11. useProfileAnalytics — Views, leads, revenue
// ════════════════════════════════════════════════════════════════════════════

export function useProfileAnalytics() {
  const store = useProfileStore();

  useEffect(() => {
    if (store.profile && store.analytics.length === 0) {
      store.loadAnalytics();
    }
  }, [store.profile, store.analytics.length]);

  const totalViews = store.analytics.reduce((sum, a) => sum + a.profile_views, 0);
  const totalRevenue = store.analytics.reduce((sum, a) => sum + (a.revenue_generated || 0), 0);
  const totalFollowers = store.analytics.reduce((sum, a) => sum + a.new_followers, 0);

  return {
    analytics: store.analytics,
    totalViews,
    totalRevenue,
    totalFollowers,
    loadAnalytics: store.loadAnalytics,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 12. useBusiness — Business operations
// ════════════════════════════════════════════════════════════════════════════

export function useBusiness() {
  const store = useProfileStore();

  return {
    // Data
    businesses: store.businesses,
    currentBusiness: store.currentBusiness,
    branches: store.branches,
    staff: store.staff,

    // Computed
    hasBusinesses: store.businesses.length > 0,
    businessCount: store.businesses.length,

    // Loaders
    loadMyBusinesses: store.loadMyBusinesses,
    loadBusiness: store.loadBusiness,
    loadBranches: store.loadBranches,
    loadStaff: store.loadStaff,

    // Mutations
    createBusiness: store.createBusiness,
    updateBusiness: store.updateBusiness,
    createBranch: store.createBranch,
    inviteStaff: store.inviteStaff,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 13. usePublicProfile — View someone else's profile
// ════════════════════════════════════════════════════════════════════════════

export function usePublicProfile(profileId: string) {
  const store = useProfileStore();

  useEffect(() => {
    if (profileId) {
      store.loadPublicSummary(profileId);
    }
  }, [profileId]);

  return {
    summary: store.publicSummary,
    isLoading: store.isLoading,
    error: store.error,
  };
}
