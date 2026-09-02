// @ts-nocheck
// MTAA Identity Engine — Barrel Export
// Import everything from here: import { useAuthStore } from '@/lib/auth/store/auth.store';

export { useIdentity, refreshIdentity } from './hooks/useIdentity';
export { useWallet } from './hooks/useWallet';
export { useProfessional } from './hooks/useProfessional';
export { useBusiness } from './hooks/useBusiness';
export { useFamily } from './hooks/useFamily';
export { useCreator } from './hooks/useCreator';
export { useReputation } from './hooks/useReputation';
export { useDocuments } from './hooks/useDocuments';
export { useAssets } from './hooks/useAssets';
export { useQR } from './hooks/useQR';
export { fetchIdentityEngine, updateIdentityCore, updateProfessionalProfile, updateBusinessProfile } from './engine';
export * from './types';
