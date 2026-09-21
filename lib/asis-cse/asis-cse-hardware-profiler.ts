// @ts-nocheck
/**
 * ASIS Hardware Profiler - Dynamic Model Selection
 * Adjusts AI complexity based on device RAM, battery, and CPU.
 */
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';

export class HardwareProfiler {
  private lastCheck = 0;
  private cachedProfile: any = null;

  async getProfile() {
    const now = Date.now();
    if (this.cachedProfile && now - this.lastCheck < 60000) return this.cachedProfile;
    
    const batteryLevel = await Battery.getBatteryLevelAsync().catch(() => 1.0);
    const isLowPower = batteryLevel < 0.2;
    const totalMemory = Device.totalMemory || 4000000000; // Default 4GB
    
    this.cachedProfile = {
      isLowPower,
      totalMemoryMB: Math.round(totalMemory / 1000000),
      deviceClass: totalMemory > 6000000000 ? 'high' : totalMemory > 3000000000 ? 'medium' : 'low',
    };
    this.lastCheck = now;
    return this.cachedProfile;
  }

  async getOptimalModel(): Promise<string> {
    const profile = await this.getProfile();
    if (profile.isLowPower) return 'phi3:mini'; // Ultra-light model
    if (profile.deviceClass === 'low') return 'qwen2.5:3b';
    if (profile.deviceClass === 'medium') return 'qwen2.5:7b';
    return 'qwen2.5:14b'; // High-end devices
  }

  shouldUseCloud(complexityScore: number): boolean {
    // If query is highly complex and device is low-end, route to cloud
    const profile = this.cachedProfile;
    if (!profile) return false;
    return profile.deviceClass === 'low' && complexityScore > 0.8;
  }
}
export const hardwareProfiler = new HardwareProfiler();
