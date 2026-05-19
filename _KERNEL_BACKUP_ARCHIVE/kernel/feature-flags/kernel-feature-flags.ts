class KernelFeatureFlags {

  private flags: Record<string, boolean> = {
    AI_CORE: true,
    AUTONOMY: true,
    REALTIME: true
  };

  isEnabled(flag: string) {

    return !!this.flags[flag];
  }

  set(flag: string, value: boolean) {

    this.flags[flag] = value;
  }
}

export const kernelFeatureFlags =
  new KernelFeatureFlags();
