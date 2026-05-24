import { Animated } from "react-native";

/**
 * ==========================================
 * MTAA APP TRANSITION ENGINE
 * MORPH-STYLE OPEN/CLOSE SYSTEM
 * ==========================================
 */

class AppTransitionEngine {
  scale = new Animated.Value(1);
  opacity = new Animated.Value(1);

  /**
   * 🚀 OPEN APP (ICON → FULLSCREEN)
   */
  open(onComplete: () => void) {
    Animated.parallel([
      Animated.timing(this.scale, {
        toValue: 1.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(this.opacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      this.reset();
      onComplete();
    });
  }

  /**
   * 🔙 CLOSE APP (FULLSCREEN → HOME)
   */
  close(onComplete: () => void) {
    Animated.parallel([
      Animated.timing(this.scale, {
        toValue: 0.9,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(this.opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      this.reset();
      onComplete();
    });
  }

  /**
   * 🔄 RESET ANIMATION STATE
   */
  reset() {
    this.scale.setValue(1);
    this.opacity.setValue(1);
  }
}

/**
 * SINGLETON (OS TRANSITION KERNEL)
 */
export const appTransitionEngine = new AppTransitionEngine();
