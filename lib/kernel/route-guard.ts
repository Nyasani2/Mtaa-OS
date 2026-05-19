import { useAuthStore } from "@/lib/stores/auth-store";
import { osShell } from "@/lib/shell/os-shell";
import { router } from "expo-router";

/**
 * ==========================================
 * MTAA ROUTE GUARD (KERNEL FIREWALL)
 * ==========================================
 *
 * Blocks unauthorized navigation BEFORE render.
 * This is NOT UI logic — this is SYSTEM SECURITY.
 */

class RouteGuard {
  private initialized = false;

  /**
   * 🧠 INIT GUARD (CALL ON APP START)
   */
  init() {
    if (this.initialized) return;

    this.initialized = true;
  }

  /**
   * 🔒 MAIN ROUTE CHECK
   */
  canAccess(path: string): boolean {
    const state = osShell.getState();
    const user = useAuthStore.getState().user;

    // 🚫 BLOCK ALL OS ACCESS WHEN LOCKED
    if (state === "locked") {
      if (path.startsWith("/(os)")) return false;
    }

    // 🚫 BLOCK LOGIN WHEN ALREADY UNLOCKED
    if (state === "unlocked" && path === "/login") {
      return false;
    }

    // 🚫 BLOCK SIGNUP WHEN UNLOCKED
    if (state === "unlocked" && path === "/signup") {
      return false;
    }

    // 🚫 BLOCK OS WHEN NO USER
    if (!user && path.startsWith("/(os)")) {
      return false;
    }

    return true;
  }

  /**
   * 🚨 ENFORCE ROUTE (HARD GUARD)
   */
  enforce(path: string) {
    if (!this.canAccess(path)) {
      const state = osShell.getState();

      if (state === "locked") {
        router.replace("/login");
      } else {
        router.replace("/");
      }

      return false;
    }

    return true;
  }
}

/**
 * SINGLETON (OS KERNEL LAYER)
 */
export const routeGuard = new RouteGuard();
