import * as LocalAuthentication from "expo-local-authentication";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/auth-store";

type KernelState = {
  initialized: boolean;
  locked: boolean;
};

class AuthKernel {
  private state: KernelState = {
    initialized: false,
    locked: true,
  };

  async boot() {
    if (this.state.initialized) return;

    const { data } = await supabase.auth.getUser();

    if (!data?.user) {
      this.lock();
      this.state.initialized = true;
      return;
    }

    this.hydrate(data.user.id, data.user.email);
    this.unlock();
    this.state.initialized = true;
  }

  lock() {
    this.state.locked = true;
    useAuthStore.getState().setUser(null);
  }

  unlock() {
    this.state.locked = false;
  }

  async biometricUnlock(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !enrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock MTAA OS",
      fallbackLabel: "Use PIN",
    });

    if (!result.success) return false;

    const { data } = await supabase.auth.getUser();
    if (!data?.user) return false;

    this.hydrate(data.user.id, data.user.email);
    this.unlock();
    return true;
  }

  async pinUnlock(pin: string): Promise<boolean> {
    const { data } = await supabase.auth.getUser();

    if (!data?.user) {
      this.lock();
      return false;
    }

    if (pin.length !== 6) {
      this.lock();
      return false;
    }

    this.hydrate(data.user.id, data.user.email);
    this.unlock();
    return true;
  }

  private hydrate(id: string, email?: string) {
    useAuthStore.getState().setUser({ id, email });
    useAuthStore.getState().setHydrated(true);
  }

  isLocked() {
    return this.state.locked;
  }
}

export const authKernel = new AuthKernel();
