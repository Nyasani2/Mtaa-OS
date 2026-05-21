import { router } from "expo-router";

/**
 * ==========================================
 * MTAA APP LAUNCH ENGINE
 * OS-LEVEL TRANSITION CONTROLLER
 * ==========================================
 */

class AppLauncher {
  private history: string[] = [];

  /**
   * 🚀 OPEN APP WITH OS TRANSITION LOGIC
   */
  open(route: string) {
    this.pushHistory(route);

    // future: animation hooks will plug in here
    router.push(route as any);
  }

  /**
   * ⬅️ BACK NAVIGATION (OS STYLE)
   */
  back() {
    if (this.history.length > 1) {
      this.history.pop();
      const previous = this.history[this.history.length - 1];

      router.replace(previous as any);
    } else {
      router.replace("/(os)/home");
    }
  }

  /**
   * 🧠 TRACK APP HISTORY (RECENTS SYSTEM FOUNDATION)
   */
  private pushHistory(route: string) {
    const last = this.history[this.history.length - 1];

    if (last !== route) {
      this.history.push(route);
    }

    // limit memory (OS-style recents cap)
    if (this.history.length > 10) {
      this.history.shift();
    }
  }

  /**
   * 📡 GET RECENT APPS
   */
  getRecents() {
    return [...this.history];
  }

  /**
   * 🔁 RESET SESSION (DEV ONLY)
   */
  reset() {
    this.history = [];
  }
}

/**
 * SINGLETON (OS INTERACTION CORE)
 */
export const appLauncher = new AppLauncher();
