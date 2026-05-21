import { Dimensions } from "react-native";
import { taskManager } from "@/lib/shell/multitasking/task-manager";

const { height } = Dimensions.get("window");

/**
 * ==========================================
 * MTAA GESTURE ENGINE (OS TOUCH LAYER)
 * FULL SYSTEM INPUT CONTROLLER
 * ==========================================
 */

class GestureEngine {
  private startY: number = 0;
  private endY: number = 0;

  /**
   * 📍 TOUCH START
   */
  onTouchStart(y: number) {
    this.startY = y;
  }

  /**
   * 📍 TOUCH END → ANALYZE GESTURE
   */
  onTouchEnd(y: number) {
    this.endY = y;

    const delta = this.endY - this.startY;

    // 🟣 SWIPE UP → RECENTS
    if (delta < -80) {
      this.openRecents();
      return;
    }

    // 🟣 SWIPE DOWN → HOME
    if (delta > 80) {
      this.goHome();
      return;
    }

    // 🟣 LIGHT MOVEMENT (reserved for future tap/edge gestures)
    if (delta > -30 && delta < 30) {
      // idle zone
      return;
    }
  }

  /**
   * 🪟 OPEN RECENTS
   */
  private openRecents() {
    taskManager.open("/(os)/recents");
  }

  /**
   * 🏠 GO HOME
   */
  private goHome() {
    taskManager.open("/(os)/home");
  }
}

/**
 * SINGLETON (OS INPUT KERNEL)
 */
export const gestureEngine = new GestureEngine();
