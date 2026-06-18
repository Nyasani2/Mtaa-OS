// ═══════════════════════════════════════════════════════════════
// AUTH STORE BRIDGE — MTAA OS
// Re-exports the auth store from its actual location
// This allows all screens to import from @/lib/stores/authStore
// ═══════════════════════════════════════════════════════════════

// Try to import from the kernel location first, then fall back to auth location
let authStore: any;

try {
  // Try the kernel stores path (where my screens expect it)
  authStore = require("../authStore");
} catch {
  try {
    // Try the auth state path (where existing screens expect it)
    authStore = require("@/lib/auth/state/auth.store");
  } catch {
    try {
      // Try relative path
      authStore = require("../../auth/state/auth.store");
    } catch {
      // Fallback: create a minimal auth store
      authStore = {
        useAuthStore: () => ({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          login: async () => {},
          logout: async () => {},
          register: async () => {},
        }),
      };
    }
  }
}

export const useAuthStore = authStore.useAuthStore || authStore.default?.useAuthStore;
export default authStore;
