// lib/auth/state/auth.store.ts
// AUTH STORE COMPATIBILITY BRIDGE
// Re-exports from the canonical location: lib/auth/store/auth.store.ts
// DO NOT add fallbacks — if the real store fails to load, the app should crash
// so we know there's a real problem, not silently serve dummy data.

export { useAuthStore } from "../store/auth.store";
