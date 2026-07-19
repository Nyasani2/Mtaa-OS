/**
 * lib/kernel/auth/identity.ts — Current-User Session Cache
 *
 * NOT the same thing as lib/kernel/identity-engine.ts (the KYC/trust-score/
 * verification-workflow engine, renamed from identity.ts independently
 * to resolve this same naming collision). Both previously exported a
 * singleton named `identityEngine`, which is a naming collision risk —
 * the wrong one and calling e.g. `.getUser()` on the KYC engine (which
 * has no such method) would be a runtime crash. Renamed to
 * `currentUserSession` on 2026-07-17 to disambiguate. This file has
 * zero importers as of that date — kept because it's a real, working,
 * distinct utility (cached current-user/profile lookup), not dead code,
 * just not yet adopted anywhere.
 */
import { supabase } from "@/lib/supabase";

/**
 * ==========================================
 * MTAA IDENTITY ENGINE
 * KERNEL-LEVEL USER IDENTITY SERVICE
 * ==========================================
 *
 * Provides unified user identity access across
 * all domain services (tribes, marketplace, wallet).
 */

export interface IdentityUser {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  kyc_level?: number;
  [key: string]: any;
}

class CurrentUserSession {
  private cache: IdentityUser | null = null;
  private cacheTime: number = 0;
  private CACHE_TTL = 30000; // 30 seconds

  /**
   * 🧠 GET CURRENT USER (with caching)
   */
  async getUser(): Promise<IdentityUser | null> {
    // Return cached if fresh
    if (this.cache && Date.now() - this.cacheTime < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        this.cache = null;
        return null;
      }

      // Fetch profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      const user: IdentityUser = {
        id: data.user.id,
        email: data.user.email,
        phone: profile?.phone || data.user.phone,
        full_name: profile?.full_name || data.user.user_metadata?.full_name,
        avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url,
        kyc_level: profile?.kyc_level || 0,
        ...profile,
      };

      this.cache = user;
      this.cacheTime = Date.now();
      return user;
    } catch (err) {
      console.error("[currentUserSession] getUser error:", err);
      return null;
    }
  }

  /**
   * 🔄 FORCE REFRESH
   */
  async refresh(): Promise<IdentityUser | null> {
    this.cache = null;
    this.cacheTime = 0;
    return this.getUser();
  }

  /**
   * 🧹 CLEAR CACHE (on logout)
   */
  clearCache() {
    this.cache = null;
    this.cacheTime = 0;
  }

  /**
   * 🔐 GET USER ID ONLY
   */
  async getUserId(): Promise<string | null> {
    const user = await this.getUser();
    return user?.id || null;
  }

  /**
   * 📊 GET KYC LEVEL
   */
  async getKycLevel(): Promise<number> {
    const user = await this.getUser();
    return user?.kyc_level || 0;
  }
}

/**
 * SINGLETON (KERNEL CORE SERVICE)
 */
export const currentUserSession = new CurrentUserSession();
