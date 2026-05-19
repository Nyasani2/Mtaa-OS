import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authKernel } from "@/lib/auth/auth-kernel";

type BootState = "booting" | "locked" | "ready";

class SecureBootLoader {
  private state: BootState = "booting";
  private initialized = false;

  async start(): Promise<void> {
    if (this.initialized) return;

    this.state = "booting";

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        this.lockSystem();
        return;
      }

      useAuthStore.getState().setUser({
        id: data.user.id,
        email: data.user.email,
      });

      useAuthStore.getState().setHydrated(true);
      authKernel.unlock();

      this.state = "ready";
      this.initialized = true;
    } catch (err) {
      this.lockSystem();
    } finally {
      this.initialized = true;
    }
  }

  private lockSystem() {
    authKernel.lock();
    useAuthStore.getState().setUser(null);
  }

  getState() {
    return this.state;
  }
}

export const secureBoot = new SecureBootLoader();
