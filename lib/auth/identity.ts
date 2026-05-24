/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LAYER 1: IDENTITY ENGINE — Supabase Auth (Single Source)    ║
 * ║  MTAA_OS_V10 — SOLE AUTH AUTHORITY                         ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * RULES:
 * 1. This is the ONLY file that talks to supabase.auth
 * 2. No UI logic here — pure identity operations
 * 3. Session state lives ONLY in Supabase, NOT in Zustand
 * 4. One listener to rule them all (registered in app/_layout.tsx)
 * 5. All errors are caught and surfaced — never silent failures
 * 6. signUp properly updates state and returns confirmation status
 * 7. signOut is atomic — state always cleared
 * 8. resetPassword + updatePassword fully implemented
 */

import { supabase } from "@/lib/supabase";
import { Session, User, AuthError } from "@supabase/supabase-js";

// ─── Types ─────────────────────────────────────────────────

export type IdentityState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

export type SignUpResult = {
  user: User | null;
  session: Session | null;
  confirmationRequired: boolean;
  message: string;
};

export type AuthErrorResult = {
  error: AuthError | Error;
  message: string;
  code?: string;
};

// ─── Singleton State (module-level, not Zustand) ───────────

let _state: IdentityState = {
  session: null,
  user: null,
  isLoading: true,
};

const _listeners = new Set<(state: IdentityState) => void>();

function _notify() {
  _listeners.forEach((fn) => fn({ ..._state }));
}

function _setState(partial: Partial<IdentityState>) {
  _state = { ..._state, ...partial };
  _notify();
}

// ─── Public API ────────────────────────────────────────────

export const identityEngine = {
  /**
   * Get current state (non-reactive, for imperative checks)
   */
  getState(): IdentityState {
    return { ..._state };
  },

  /**
   * Subscribe to identity changes.
   * Returns unsubscribe function.
   */
  subscribe(fn: (state: IdentityState) => void): () => void {
    _listeners.add(fn);
    fn({ ..._state });
    return () => {
      _listeners.delete(fn);
    };
  },

  /**
   * BOOT SEQUENCE — Call once at app startup.
   * Checks for existing session and hydrates state.
   */
  async boot(): Promise<void> {
    _setState({ isLoading: true });

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("[IdentityEngine] Session fetch error:", error.message);
        _setState({ session: null, user: null, isLoading: false });
        return;
      }

      const session = data.session;

      if (session?.user) {
        _setState({
          session,
          user: session.user,
          isLoading: false,
        });
      } else {
        _setState({ session: null, user: null, isLoading: false });
      }
    } catch (err: any) {
      console.error("[IdentityEngine] Boot crash:", err);
      _setState({ session: null, user: null, isLoading: false });
    }
  },

  /**
   * Start the SINGLE auth state listener.
   * Call this once after boot. Returns cleanup function.
   */
  startListener(): () => void {
    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          _setState({
            session,
            user: session.user,
            isLoading: false,
          });
        } else {
          _setState({
            session: null,
            user: null,
            isLoading: false,
          });
        }
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  },

  /**
   * Sign in with email/password
   * Returns session on success, throws AuthError on failure
   */
  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      // Surface specific error messages
      let message = error.message;
      if (error.message.includes("Invalid login")) {
        message = "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Please confirm your email before signing in.";
      }
      throw new AuthError(message, error.status || 400, error.code);
    }
    if (!data.session) throw new Error("No session returned after sign in");
    _setState({ session: data.session, user: data.user, isLoading: false });
    return data.session;
  },

  /**
   * Sign up with email/password
   * FIX: Now properly updates state and returns confirmation status
   */
  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, any>
  ): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) {
      let message = error.message;
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        message = "An account with this email already exists.";
      }
      throw new AuthError(message, error.status || 400, error.code);
    }

    // FIX: Update state even if session is null (email confirmation pending)
    const confirmationRequired = !data.session;
    _setState({
      session: data.session,
      user: data.user,
      isLoading: false,
    });

    return {
      user: data.user,
      session: data.session,
      confirmationRequired,
      message: confirmationRequired
        ? "Check your email to confirm your account."
        : "Account created successfully.",
    };
  },

  /**
   * Sign out — clears everything ATOMICALLY
   * FIX: Always clears state even if Supabase throws
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error("[IdentityEngine] signOut Supabase error:", err.message);
      // Continue to clear local state regardless
    } finally {
      _setState({ session: null, user: null, isLoading: false });
    }
  },

  /**
   * Send password reset email
   * NEW: Full forgot password flow
   */
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const redirectUrl = process.env.EXPO_PUBLIC_RESET_URL || 
        (typeof window !== "undefined" ? window.location.origin + "/auth/reset-password" : "");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return {
          success: false,
          message: error.message.includes("not found")
            ? "No account found with this email."
            : error.message,
        };
      }

      return {
        success: true,
        message: "Password reset link sent. Check your email.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to send reset link.",
      };
    }
  },

  /**
   * Update user password (after reset)
   * NEW: Full password update flow
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: "Password updated successfully.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to update password.",
      };
    }
  },

  /**
   * Resend email confirmation
   * NEW: Handle users who lost confirmation email
   */
  async resendConfirmation(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: "Confirmation email resent. Check your inbox.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to resend confirmation.",
      };
    }
  },

  /**
   * Refresh profile from profiles table
   */
  async refreshProfile(userId: string): Promise<Record<string, any> | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.warn("[IdentityEngine] Profile fetch:", error.message);
      return null;
    }
    return data;
  },
};

// ─── React Hook ────────────────────────────────────────────

import { useState, useEffect } from "react";

export function useIdentity(): IdentityState & {
  signIn: typeof identityEngine.signIn;
  signUp: typeof identityEngine.signUp;
  signOut: typeof identityEngine.signOut;
  resetPassword: typeof identityEngine.resetPassword;
  updatePassword: typeof identityEngine.updatePassword;
  resendConfirmation: typeof identityEngine.resendConfirmation;
  refreshProfile: typeof identityEngine.refreshProfile;
} {
  const [state, setState] = useState<IdentityState>(_state);

  useEffect(() => {
    return identityEngine.subscribe(setState);
  }, []);

  return {
    ...state,
    signIn: identityEngine.signIn,
    signUp: identityEngine.signUp,
    signOut: identityEngine.signOut,
    resetPassword: identityEngine.resetPassword,
    updatePassword: identityEngine.updatePassword,
    resendConfirmation: identityEngine.resendConfirmation,
    refreshProfile: identityEngine.refreshProfile,
  };
}
