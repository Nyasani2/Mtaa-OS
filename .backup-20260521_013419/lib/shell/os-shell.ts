import { secureBoot } from "@/lib/boot/secure-boot";
import { authKernel } from "@/lib/auth/auth-kernel";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * ==========================================
 * MTAA OS SHELL CONTROLLER
 * THE "WINDOW MANAGER" OF YOUR OS
 * ==========================================
 *
 * This is NOT navigation.
 * This is SYSTEM STATE CONTROL.
 */

export type ShellState = "booting" | "locked" | "unlocked";

class OSShell {
  private state: ShellState = "booting";
  private listeners: Array<(s: ShellState) => void> = [];

  /**
   * 🧠 INIT SHELL (CALL AFTER BOOT)
   */
  async init() {
    // wait for boot to finish
    await secureBoot.start();

    this.syncState();
  }

  /**
   * 🔄 SYNC SYSTEM STATE → SHELL STATE
   */
  syncState() {
    const bootState = secureBoot.getState();
    const user = useAuthStore.getState().user;

    if (bootState === "booting") {
      this.setState("booting");
      return;
    }

    if (!user || authKernel.isLocked()) {
      this.setState("locked");
      return;
    }

    this.setState("unlocked");
  }

  /**
   * 🔐 LOCK SYSTEM (GLOBAL)
   */
  lock() {
    authKernel.lock();
    useAuthStore.getState().setUser(null);
    this.setState("locked");
  }

  /**
   * 🔓 UNLOCK SYSTEM
   */
  unlock() {
    authKernel.unlock();
    this.syncState();
  }

  /**
   * 📡 STATE UPDATE SYSTEM
   */
  private setState(state: ShellState) {
    if (this.state === state) return;

    this.state = state;
    this.emit();
  }

  getState() {
    return this.state;
  }

  /**
   * 👂 SUBSCRIBE TO OS STATE
   */
  subscribe(cb: (s: ShellState) => void) {
    this.listeners.push(cb);
    cb(this.state);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l(this.state));
  }
}

/**
 * SINGLETON (OS CORE SERVICE)
 */
export const osShell = new OSShell();
