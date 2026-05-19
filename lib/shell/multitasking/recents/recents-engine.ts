import { taskManager } from "../task-manager";

/**
 * ==========================================
 * MTAA RECENTS ENGINE (MULTITASK VISUAL LAYER)
 * ==========================================
 *
 * Controls:
 * - app stacking
 * - minimization vs close
 * - recents ordering
 */

class RecentsEngine {
  private stack: string[] = [];

  /**
   * 🟣 APP OPEN → PUSH INTO STACK
   */
  push(route: string) {
    this.stack = this.stack.filter(r => r !== route);
    this.stack.push(route);
  }

  /**
   * 🟣 MINIMIZE APP (NOT CLOSE)
   */
  minimize(route: string) {
    // stays in stack, just mark as background-ready
    this.push(route);
  }

  /**
   * ❌ CLOSE APP
   */
  close(route: string) {
    this.stack = this.stack.filter(r => r !== route);
  }

  /**
   * 🪟 GET RECENTS STACK
   */
  getRecents() {
    return [...this.stack].reverse();
  }

  /**
   * 🧠 CLEAR ALL (DEV)
   */
  clear() {
    this.stack = [];
  }
}

export const recentsEngine = new RecentsEngine();
