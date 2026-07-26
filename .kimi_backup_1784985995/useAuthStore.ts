// lib/auth/useAuthStore.ts
// DEPRECATED: Use @/lib/auth/useAuth instead
// This barrel re-exports for backward compatibility

export { useAuth, useIdentity, useAuthStore } from './useAuth';
export type { AuthState, User } from './store/auth.store';
