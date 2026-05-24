import { secureBoot } from "@/lib/boot/secure-boot";
import { authKernel } from "@/lib/auth/auth-kernel";
import { identityEngine } from "@/lib/auth/identity";

export type ShellState = "booting" | "locked" | "unlocked";

class OSShell {
  private state: ShellState = "booting";
  private listeners: Array<(s: ShellState) => void> = [];

  async init() {
    await secureBoot.start();
    this.syncState();
  }

  syncState() {
    const bootState = secureBoot.getState();
    const { user } = identityEngine.getState();

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

  lock() {
    authKernel.lock();
    identityEngine.signOut();
    this.setState("locked");
  }

  unlock() {
    authKernel.unlock();
    this.syncState();
  }

  private setState(state: ShellState) {
    if (this.state === state) return;
    this.state = state;
    this.emit();
  }

  getState() {
    return this.state;
  }

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

export const osShell = new OSShell();
