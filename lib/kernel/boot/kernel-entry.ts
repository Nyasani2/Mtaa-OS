import { identityEngine } from "@/lib/auth/identity";
import { secureBoot } from "@/lib/boot/secure-boot";
import { osShell } from "@/lib/shell/os-shell";

/**
 * ╔════════════════════════════════════════════════════╗
 * ║  KERNEL ENTRY — SINGLE BOOT ORCHESTRATOR           ║
 * ║  MTAA OS V10 — ONE SOURCE OF TRUTH                 ║
 * ╚════════════════════════════════════════════════════╝
 */

class KernelEntry {
  private initialized = false;

  async boot() {
    if (this.initialized) return;

    console.log("[Kernel] Boot sequence starting...");

    try {
      // 1. Boot identity (Supabase session)
      await identityEngine.boot();

      // 2. Start auth listener (ONLY ONCE)
      identityEngine.startListener();

      // 3. Boot secure system state
      await secureBoot.start();

      // 4. Initialize OS shell state machine
      await osShell.init();

      console.log("[Kernel] Boot complete");
    } catch (err) {
      console.error("[Kernel] Boot failed:", err);
    } finally {
      this.initialized = true;
    }
  }
}

export const kernelEntry = new KernelEntry();
