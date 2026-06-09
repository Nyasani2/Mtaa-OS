// ============================================================================
// MTAA Profile OS — Barrel Export
// ============================================================================

// Types
export * from './types';

// Services
export {
  profileService,
  profileRoleService,
  profileVerificationService,
  profileReputationService,
  profileAchievementService,
  profilePortfolioService,
  profileSkillService,
  profileCertificationService,
  profileConnectionService,
  profileSettingsService,
  profileAnalyticsService,
} from './services/profile-service';

export {
  businessService,
  businessBranchService,
  businessStaffService,
  profileBusinessService,
} from './services/business-service';

// State
export { useProfileStore } from './state/profile-store';

// Hooks
export {
  useProfile,
  useProfileRoles,
  useProfileVerifications,
  useProfileReputation,
  useProfileAchievements,
  useProfilePortfolio,
  useProfileSkills,
  useProfileCertifications,
  useProfileNetwork,
  useProfileSettings,
  useProfileAnalytics,
  useBusiness,
  usePublicProfile,
} from './hooks/useProfile';
