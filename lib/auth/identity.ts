/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LAYER 1: IDENTITY ENGINE — Supabase Auth                   ║
 * ║  MTAA_OS_V10                                                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { supabase } from "@/lib/supabase";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// INTERNAL STATE
// ─────────────────────────────────────────────

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
  _state = {
    ..._state,
    ...partial,
  };

  _notify();
}

// ─────────────────────────────────────────────
// IDENTITY ENGINE
// ─────────────────────────────────────────────

export const identityEngine = {
  getState(): IdentityState {
    return { ..._state };
  },

  subscribe(fn: (state: IdentityState) => void) {
    _listeners.add(fn);

    fn({ ..._state });

    return () => {
      _listeners.delete(fn);
    };
  },

  // ─────────────────────────────────────────
  // BOOT
  // ─────────────────────────────────────────

  async boot(): Promise<void> {
    _setState({
      isLoading: true,
    });

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.log("[Identity Boot Error]", error.message);

        _setState({
          session: null,
          user: null,
          isLoading: false,
        });

        return;
      }

      _setState({
        session: data.session,
        user: data.session?.user ?? null,
        isLoading: false,
      });

      console.log(
        "[Identity Boot]",
        data.session?.user?.email || "NO SESSION"
      );
    } catch (e: any) {
      console.log("[Identity Boot Fatal]", e?.message);

      _setState({
        session: null,
        user: null,
        isLoading: false,
      });
    }
  },

  // ─────────────────────────────────────────
  // AUTH LISTENER
  // ─────────────────────────────────────────

  startListener(): () => void {
    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AUTH EVENT]", event);

        _setState({
          session,
          user: session?.user ?? null,
          isLoading: false,
        });
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  },

  // ─────────────────────────────────────────
  // SIGN IN
  // ─────────────────────────────────────────

  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      throw new AuthError(
        error.message,
        error.status || 400,
        error.code
      );
    }

    if (!data.session) {
      throw new Error("No session returned");
    }

    _setState({
      session: data.session,
      user: data.user,
      isLoading: false,
    });

    return data.session;
  },

  // ─────────────────────────────────────────
  // SIGN UP
  // ─────────────────────────────────────────

  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, any>
  ): Promise<SignUpResult> {
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

    if (error) {
      throw error;
    }

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
        ? "Check your email to confirm account."
        : "Account created.",
    };
  },

  // ─────────────────────────────────────────
  // SIGN OUT
  // ─────────────────────────────────────────

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e: any) {
      console.log("[SignOut Error]", e?.message);
    }

    _setState({
      session: null,
      user: null,
      isLoading: false,
    });
  },

  // ─────────────────────────────────────────
  // PASSWORD RESET
  // ─────────────────────────────────────────

  async resetPassword(
    email: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const redirectTo =
        "mtaa://auth/reset-password";

      console.log("[RESET REDIRECT]", redirectTo);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo,
          }
        );

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message:
          "Password reset email sent.",
      };
    } catch (e: any) {
      return {
        success: false,
        message:
          e?.message ||
          "Failed to send reset email.",
      };
    }
  },

  // ─────────────────────────────────────────
  // UPDATE PASSWORD
  // ─────────────────────────────────────────

  async updatePassword(
    password: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const { data: sessionData } =
        await supabase.auth.getSession();

      console.log(
        "[UPDATE PASSWORD SESSION]",
        !!sessionData.session
      );

      if (!sessionData.session) {
        return {
          success: false,
          message:
            "Auth session missing. Open the reset link again from email.",
        };
      }

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message:
          "Password updated successfully.",
      };
    } catch (e: any) {
      return {
        success: false,
        message:
          e?.message ||
          "Password update failed.",
      };
    }
  },

  // ─────────────────────────────────────────
  // RESEND CONFIRMATION
  // ─────────────────────────────────────────

  async resendConfirmation(email: string) {
    try {
      const { error } =
        await supabase.auth.resend({
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
        message:
          "Confirmation email resent.",
      };
    } catch (e: any) {
      return {
        success: false,
        message:
          e?.message ||
          "Failed to resend email.",
      };
    }
  },
};

// ─────────────────────────────────────────────
// REACT HOOK
// ─────────────────────────────────────────────

export function useIdentity(): IdentityState & {
  signIn: typeof identityEngine.signIn;
  signUp: typeof identityEngine.signUp;
  signOut: typeof identityEngine.signOut;
  resetPassword: typeof identityEngine.resetPassword;
  updatePassword: typeof identityEngine.updatePassword;
  resendConfirmation: typeof identityEngine.resendConfirmation;
} {
  const [state, setState] =
    useState<IdentityState>(_state);

  useEffect(() => {
    return identityEngine.subscribe(setState);
  }, []);

  return {
    ...state,
    signIn: identityEngine.signIn,
    signUp: identityEngine.signUp,
    signOut: identityEngine.signOut,
    resetPassword:
      identityEngine.resetPassword,
    updatePassword:
      identityEngine.updatePassword,
    resendConfirmation:
      identityEngine.resendConfirmation,
  };
}
