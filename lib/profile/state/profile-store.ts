// @ts-nocheck
// ============================================================================
// MTAA Profile OS — State Layer (Zustand Store)
// Central state management for Profile, Business, Portfolio, Network, Analytics
// ============================================================================

import { create } from 'zustand';
import type {
  Profile, ProfileRole, ProfileVerification, ProfileReputation,
  ProfileAchievement, ProfilePortfolio, ProfileSkill, ProfileCertification,
  ProfileConnection, ProfileSettings, ProfileAnalytics, Business, BusinessBranch,
  BusinessStaff, PublicProfileSummary, ProfileType, VerificationType,
  ConnectionType, StaffRole
} from '../types';
import {
  profileService, profileRoleService, profileVerificationService,
  profileReputationService, profileAchievementService, profilePortfolioService,
  profileSkillService, profileCertificationService, profileConnectionService,
  profileSettingsService, profileAnalyticsService
} from '../services/profile-service';
import {
  businessService, businessBranchService, businessStaffService
} from '../services/business-service';

// ── Profile Store ────────────────────────────────────────────────────────────

interface ProfileState {
  // Data
  profile: Profile | null;
  roles: ProfileRole[];
  verifications: ProfileVerification[];
  reputation: ProfileReputation | null;
  achievements: ProfileAchievement[];
  portfolios: ProfilePortfolio[];
  skills: ProfileSkill[];
  certifications: ProfileCertification[];
  connections: ProfileConnection[];
  settings: ProfileSettings | null;
  analytics: ProfileAnalytics[];
  publicSummary: PublicProfileSummary | null;

  // Business data
  businesses: Business[];
  currentBusiness: Business | null;
  branches: BusinessBranch[];
  staff: BusinessStaff[];

  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  activeTab: string;
  selectedSection: string | null;

  // Actions
  setProfile: (profile: Profile | null) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: string) => void;
  setSelectedSection: (section: string | null) => void;

  // Loaders
  loadProfile: () => Promise<void>;
  loadRoles: () => Promise<void>;
  loadVerifications: () => Promise<void>;
  loadReputation: () => Promise<void>;
  loadAchievements: () => Promise<void>;
  loadPortfolios: () => Promise<void>;
  loadSkills: () => Promise<void>;
  loadCertifications: () => Promise<void>;
  loadConnections: () => Promise<void>;
  loadSettings: () => Promise<void>;
  loadAnalytics: (days?: number) => Promise<void>;
  loadPublicSummary: (profileId: string) => Promise<void>;

  // Business loaders
  loadMyBusinesses: () => Promise<void>;
  loadBusiness: (businessId: string) => Promise<void>;
  loadBranches: (businessId: string) => Promise<void>;
  loadStaff: (businessId: string) => Promise<void>;

  // Mutations
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  addRole: (roleType: ProfileType) => Promise<void>;
  submitVerification: (type: VerificationType, documents: any[]) => Promise<void>;
  addAchievement: (achievement: Partial<ProfileAchievement>) => Promise<void>;
  createPortfolio: (portfolio: Partial<ProfilePortfolio>) => Promise<void>;
  addSkill: (skill: Partial<ProfileSkill>) => Promise<void>;
  endorseSkill: (skillId: string) => Promise<void>;
  addCertification: (cert: Partial<ProfileCertification>) => Promise<void>;
  connect: (profileId: string, type?: ConnectionType) => Promise<void>;
  updateSettings: (settings: Partial<ProfileSettings>) => Promise<void>;

  // Business mutations
  createBusiness: (business: Partial<Business>) => Promise<void>;
  updateBusiness: (businessId: string, updates: Partial<Business>) => Promise<void>;
  createBranch: (branch: Partial<BusinessBranch>) => Promise<void>;
  inviteStaff: (businessId: string, profileId: string, role: StaffRole) => Promise<void>;

  // Full refresh
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state
  profile: null,
  roles: [],
  verifications: [],
  reputation: null,
  achievements: [],
  portfolios: [],
  skills: [],
  certifications: [],
  connections: [],
  settings: null,
  analytics: [],
  publicSummary: null,
  businesses: [],
  currentBusiness: null,
  branches: [],
  staff: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  activeTab: 'overview',
  selectedSection: null,

  // Setters
  setProfile: (profile) => set({ profile }),
  setError: (error) => set({ error }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedSection: (selectedSection) => set({ selectedSection }),
  clearError: () => set({ error: null }),

  // ── Loaders ────────────────────────────────────────────────────────────────

  loadProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await (profileService as any).getMyProfile();
      set({ profile, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadRoles: async () => {
    try {
      const roles = await (profileRoleService as any).getMyRoles();
      set({ roles });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadVerifications: async () => {
    try {
      const verifications = await (profileVerificationService as any).getMyVerifications();
      set({ verifications });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadReputation: async () => {
    try {
      const reputation = await (profileReputationService as any).getMyReputation();
      set({ reputation });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadAchievements: async () => {
    try {
      const profile = get().profile;
      if (!profile) return;
      const achievements = await (profileAchievementService as any).getAchievements(profile.id);
      set({ achievements });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadPortfolios: async () => {
    try {
      const portfolios = await (profilePortfolioService as any).getMyPortfolios();
      set({ portfolios });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadSkills: async () => {
    try {
      const profile = get().profile;
      if (!profile) return;
      const skills = await (profileSkillService as any).getSkills(profile.id);
      set({ skills });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadCertifications: async () => {
    try {
      const profile = get().profile;
      if (!profile) return;
      const certifications = await (profileCertificationService as any).getCertifications(profile.id);
      set({ certifications });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadConnections: async () => {
    try {
      const connections = await (profileConnectionService as any).getMyConnections();
      set({ connections });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadSettings: async () => {
    try {
      const settings = await (profileSettingsService as any).getMySettings();
      set({ settings });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadAnalytics: async (days = 30) => {
    try {
      const analytics = await (profileAnalyticsService as any).getMyAnalytics(days);
      set({ analytics });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadPublicSummary: async (profileId: string) => {
    try {
      const publicSummary = await (profileService as any).getPublicProfileSummary(profileId);
      set({ publicSummary });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  // ── Business Loaders ───────────────────────────────────────────────────────

  loadMyBusinesses: async () => {
    try {
    // @ts-ignore
      const businesses = await businessService.getMyBusinesses();
      set({ businesses });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadBusiness: async (businessId: string) => {
    try {
    // @ts-ignore
      const currentBusiness = await businessService.getBusinessById(businessId);
      set({ currentBusiness });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadBranches: async (businessId: string) => {
    try {
    // @ts-ignore
      const branches = await businessBranchService.getBranches(businessId);
      set({ branches });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadStaff: async (businessId: string) => {
    try {
    // @ts-ignore
      const staff = await businessStaffService.getStaff(businessId);
      set({ staff });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  // ── Mutations ──────────────────────────────────────────────────────────────

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await (profileService as any).updateProfile(updates);
      set({ profile, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  addRole: async (roleType) => {
    try {
      await (profileRoleService as any).addRole(roleType);
      await get().loadRoles();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  submitVerification: async (type, documents) => {
    try {
      await (profileVerificationService as any).submitVerification(type, documents);
      await get().loadVerifications();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  addAchievement: async (achievement) => {
    try {
      await (profileAchievementService as any).addAchievement(achievement);
      await get().loadAchievements();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  createPortfolio: async (portfolio) => {
    try {
      await (profilePortfolioService as any).createPortfolio(portfolio);
      await get().loadPortfolios();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  addSkill: async (skill) => {
    try {
      await (profileSkillService as any).addSkill(skill);
      await get().loadSkills();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  endorseSkill: async (skillId) => {
    try {
      await (profileSkillService as any).endorseSkill(skillId);
      await get().loadSkills();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  addCertification: async (cert) => {
    try {
      await (profileCertificationService as any).addCertification(cert);
      await get().loadCertifications();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  connect: async (profileId, type: any = 'contact' as any) => {
    try {
      await (profileConnectionService as any).connect(profileId, type);
      await get().loadConnections();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  updateSettings: async (settings) => {
    try {
      const updated = await (profileSettingsService as any).updateSettings(settings);
      set({ settings: updated });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  // ── Business Mutations ─────────────────────────────────────────────────────

  createBusiness: async (business) => {
    set({ isLoading: true, error: null });
    try {
    // @ts-ignore
      await businessService.createBusiness(business);
      await get().loadMyBusinesses();
      set({ isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  updateBusiness: async (businessId, updates) => {
    try {
    // @ts-ignore
      await businessService.updateBusiness(businessId, updates);
      await get().loadMyBusinesses();
      if (get().currentBusiness?.id === businessId) {
        await get().loadBusiness(businessId);
      }
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  createBranch: async (branch) => {
    try {
    // @ts-ignore
      await businessBranchService.createBranch(branch);
      if (branch.business_id) {
        await get().loadBranches(branch.business_id);
      }
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  inviteStaff: async (businessId, profileId, role) => {
    try {
    // @ts-ignore
      await businessStaffService.inviteStaff(businessId, profileId, role);
      await get().loadStaff(businessId);
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  // ── Full Refresh ───────────────────────────────────────────────────────────

  refreshAll: async () => {
    set({ isRefreshing: true, error: null });
    try {
      await get().loadProfile();
      await Promise.all([
        get().loadRoles(),
        get().loadVerifications(),
        get().loadReputation(),
        get().loadAchievements(),
        get().loadPortfolios(),
        get().loadSkills(),
        get().loadCertifications(),
        get().loadConnections(),
        get().loadSettings(),
        get().loadAnalytics(),
        get().loadMyBusinesses(),
      ]);
      set({ isRefreshing: false });
    } catch (e: any) {
      set({ error: e.message, isRefreshing: false });
    }
  },
}));
