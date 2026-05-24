/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  OS SHELL — SOLE BOOT + PHASE + LOCK AUTHORITY               ║
 * ║  MTAA_OS_V10 — Merged from secure-boot + auth-kernel        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * RULES:
 * 1. This is the ONLY boot state authority
 * 2. This is the ONLY lock state authority
 * 3. This is the ONLY OS phase authority
 * 4. Subscribes to identityEngine + pinEngine (read-only)
 * 5. No duplicate state machines
 * 6. No Zustand
 * 7. All phases: booting → no_session → locked → unlocked → safe_mode
 */

import { identityEngine, IdentityState } from "@/lib/auth/identity";
import { pinEngine } from "@/lib/security/pin-engine";

export type ShellPhase =
  | "booting"
  | "no_session"
  | "locked"
  | "unlocked"
  | "safe_mode";

export type ShellState = {
  phase: ShellPhase;
  isLoading: boolean;
  user: IdentityState["user"];
  session: IdentityState["session"];
  pinEnabled: boolean;
  pinVerified: boolean;
};

// ─── Singleton State ───────────────────────────────────────

let _state: ShellState = {
  phase: "booting",
  isLoading: true,
  user: null,
  session: null,
  pinEnabled: false,
  pinVerified: false,
};

const _listeners = new Set<(state: ShellState) => void>();
let _initialized = false;
let _identityUnsub: (() => void) | null = null;
let _pinUnsub: (() => void) | null = null;

function _notify() {
  _listeners.forEach((fn) => fn({ ..._state }));
}

function _setState(partial: Partial<ShellState>) {
  _state = { ..._state, ...partial };
  _notify();
}

function _syncPhase() {
  const { session, user, isLoading } = identityEngine.getState();
  const pinEnabled = _state.pinEnabled;
  const pinVerified = _state.pinVerified;

  if (isLoading) {
    _setState({ phase: "booting", isLoading: true });
    return;
  }

  if (!session || !user) {
    _setState({ phase: "no_session", isLoading: false, user: null, session: null });
    return;
  }

  if (pinEnabled && !pinVerified) {
    _setState({
      phase: "locked",
      isLoading: false,
      user,
      session,
    });
    return;
  }

  _setState({
    phase: "unlocked",
    isLoading: false,
    user,
    session,
  });
}

// ─── Public API ────────────────────────────────────────────

export const osShell = {
  /**
   * Initialize shell — call once at app startup
   * Subscribes to identityEngine and pinEngine
   */
  async init(): Promise<void> {
    if (_initialized) return;

    _setState({ phase: "booting", isLoading: true });

    // Subscribe to identity changes
    _identityUnsub = identityEngine.subscribe((identityState) => {
      _setState({
        user: identityState.user,
        session: identityState.session,
        isLoading: identityState.isLoading,
      });
      _syncPhase();
    });

    // Subscribe to PIN changes
    _pinUnsub = pinEngine.subscribe((verified) => {
      _setState({ pinVerified: verified });
      _syncPhase();
    });

    // Check PIN enabled status
    const pinEnabled = await pinEngine.isEnabled();
    _setState({ pinEnabled });

    // Sync initial phase
    _syncPhase();

    _initialized = true;
    console.log("[OSShell] Initialized, phase:", _state.phase);
  },

  /**
   * Lock the OS (sign out + clear PIN verification)
   */
  async lock(): Promise<void> {
    await pinEngine.lock();
    await identityEngine.signOut();
    // Phase will update via identityEngine subscriber
  },

  /**
   * Unlock with PIN
   */
  async unlockWithPin(pin: string): Promise<boolean> {
    const valid = await pinEngine.verifyPin(pin);
    if (valid) {
      _syncPhase();
    }
    return valid;
  },

  /**
   * Unlock with biometric
   */
  async unlockWithBiometric(): Promise<boolean> {
    const success = await pinEngine.biometricUnlock();
    if (success) {
      _syncPhase();
    }
    return success;
  },

  /**
   * Enter safe mode (kernel degradation)
   */
  enterSafeMode(): void {
    _setState({ phase: "safe_mode" });
  },

  /**
   * Get current state
   */
  getState(): ShellState {
    return { ..._state };
  },

  /**
   * Subscribe to shell state changes
   */
  subscribe(cb: (state: ShellState) => void): () => void {
    _listeners.add(cb);
    cb({ ..._state });
    return () => {
      _listeners.delete(cb);
    };
  },

  /**
   * Cleanup subscriptions
   */
  destroy(): void {
    if (_identityUnsub) {
      _identityUnsub();
      _identityUnsub = null;
    }
    if (_pinUnsub) {
      _pinUnsub();
      _pinUnsub = null;
    }
    _listeners.clear();
    _initialized = false;
    _state = {
      phase: "booting",
      isLoading: true,
      user: null,
      session: null,
      pinEnabled: false,
      pinVerified: false,
    };
  },
};

// ─── React Hook ────────────────────────────────────────────

import { useState, useEffect } from "react";

export function useOSShell(): ShellState & {
  lock: typeof osShell.lock;
  unlockWithPin: typeof osShell.unlockWithPin;
  unlockWithBiometric: typeof osShell.unlockWithBiometric;
} {
  const [state, setState] = useState<ShellState>(_state);

  useEffect(() => {
    return osShell.subscribe(setState);
  }, []);

  return {
    ...state,
    lock: osShell.lock,
    unlockWithPin: osShell.unlockWithPin,
    unlockWithBiometric: osShell.unlockWithBiometric,
  };
}
