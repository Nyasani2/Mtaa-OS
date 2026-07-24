// lib/system/hooks/asis-boot-hook.ts
// FIXED: Removed activateAllAdapters() call since the function was removed
// The adapter itself says this is a "deliberate choice pending a decision"

import { useEffect } from 'react';

export function useASISBoot() {
  useEffect(() => {
    // Fraud monitoring activation deliberately disabled
    // See lib/system/adapters/asis-adapter.ts for context
    // activateAllAdapters() was removed 2026-07-16 due to broken imports
    // Re-enable when fraud monitoring is ready for production
  }, []);
}
