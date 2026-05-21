import { router } from "expo-router";
import { appTransitionEngine } from "@/lib/shell/transitions/app-transition";
import { recentsEngine } from "./recents/recents-engine";

/**
 * ==========================================
 * MTAA TASK MANAGER (MULTITASK CORE)
 * ==========================================
 */

class TaskManager {
  private active: string[] = [];

  /**
   * 🚀 OPEN APP
   */
  open(route: string) {
    recentsEngine.push(route);

    this.active = this.active.filter(r => r !== route);
    this.active.push(route);

    router.push(route as any);
  }

  /**
   * 🟣 MINIMIZE APP (KEEP IN RECENTS)
   */
  minimize(route: string) {
    recentsEngine.minimize(route);
    router.replace("/(os)/home");
  }

  /**
   * ❌ CLOSE APP
   */
  close(route: string) {
    recentsEngine.close(route);

    this.active = this.active.filter(r => r !== route);

    const fallback =
      this.active[this.active.length - 1] || "/(os)/home";

    router.replace(fallback as any);
  }

  /**
   * ⬅️ BACK NAVIGATION
   */
  back() {
    this.active.pop();

    const previous =
      this.active[this.active.length - 1] || "/(os)/home";

    router.replace(previous as any);
  }

  /**
   * 🪟 GET ACTIVE STACK
   */
  getActive() {
    return [...this.active];
  }
}

export const taskManager = new TaskManager();
