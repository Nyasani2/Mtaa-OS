// Canonical auth exports — ONE source of truth
export { useAuthStore } from './store/auth.store';
export type { AuthState, User, UserProfile } from './store/auth.store';

// Wrapper hooks (add router logic, PIN state)
export { useAuth } from './useAuth';
export { useIdentity } from './use-identity';

// Context provider
export { IdentityProvider } from './identity-provider';

// OS Gate
export { default as OSGate } from './os-gate';
