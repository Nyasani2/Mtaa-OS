// asis/deployment/adapters/mobile-adapter.ts
// Optimizes ASIS for Android low-end devices

import { environmentConfig } from '../environment-config';

class MobileAdapter {
  private deviceProfile: 'low' | 'mid' | 'high' = 'mid';

  async detectDevice(): Promise<void> {
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    if (memory <= 2 || cores <= 2) {
      this.deviceProfile = 'low';
    } else if (memory >= 6 && cores >= 6) {
      this.deviceProfile = 'high';
    } else {
      this.deviceProfile = 'mid';
    }

    this.applyOptimizations();
  }

  private applyOptimizations() {
    const config = environmentConfig.get();

    if (this.deviceProfile === 'low') {
      // Reduce agent concurrency
      config.safetyThresholds.maxAgentConcurrency = 1;
      config.safetyThresholds.maxMemoryAllocationMB = 64;
      config.performance.lazyLoad = true;
      config.performance.prefetch = false;
    }

    console.log(`[ASIS] Mobile adapter: ${this.deviceProfile} device profile applied`);
  }

  getProfile(): string {
    return this.deviceProfile;
  }
}

export const mobileAdapter = new MobileAdapter();
