// ═══════════════════════════════════════════════════════════════
// AUTH STORE COMPATIBILITY BRIDGE
// Existing health files import from @/lib/auth/state/auth.store
// Actual file lives at lib/auth/store/auth.store.ts
// This bridge re-exports from the correct location
// ═══════════════════════════════════════════════════════════════

import { useAuthStore as actualUseAuthStore } from "../store/auth.store";

export { useAuthStore } from "../store/auth.store";
export default { useAuthStore: actualUseAuthStore };
