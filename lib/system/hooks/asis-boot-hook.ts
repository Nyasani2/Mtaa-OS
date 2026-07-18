// ============================================================
// MTAA OS V10 — ASIS Fraud Monitoring Boot Hook
// Auto-activates all fraud adapters on app startup
// ============================================================

import { useEffect } from 'react';
import { activateAllAdapters } from '@/lib/system/adapters/asis-adapter';

let activated = false;

export function useASISBoot() {
  useEffect(() => {
    if (activated) return;
    activated = true;

    // Activate fraud monitoring after a short delay to not block boot
    const timer = setTimeout(() => {
      try {
        activateAllAdapters();
        console.log('[ASIS] Fraud monitoring activated');
      } catch (e) {
        console.error('[ASIS] Failed to activate fraud monitoring:', e);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
}
