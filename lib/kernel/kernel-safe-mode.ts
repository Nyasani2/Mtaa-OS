// lib/kernel/kernel-safe-mode.ts
import { kernel } from './kernel-init';

export interface SafeModeConfig {
  enabledModules: string[];
  disableFeatures: string[];
  fallbackRoutes: Record<string, string>;
  showDiagnostics: boolean;
}

const DEFAULT_SAFE_MODE: SafeModeConfig = {
  enabledModules: ['auth', 'wallet'],
  disableFeatures: ['analytics', 'search', 'social'],
  fallbackRoutes: {
    '/health': '/wallet',
    '/appstore': '/wallet',
    '/mtaxi': '/wallet',
    '/marketplace': '/wallet',
  },
  showDiagnostics: true,
};

export class SafeModeManager {
  private static config: SafeModeConfig = { ...DEFAULT_SAFE_MODE };
  private static isActive = false;

  static activate(config?: Partial<SafeModeConfig>) {
    this.isActive = true;
    this.config = { ...DEFAULT_SAFE_MODE, ...config };
    console.log('[SafeMode] Activated with modules:', this.config.enabledModules);
  }

  static deactivate() {
    this.isActive = false;
    console.log('[SafeMode] Deactivated');
  }

  static isSafeMode(): boolean {
    return this.isActive || kernel.getState().bootPhase === 'safe_mode';
  }

  static isModuleEnabled(moduleName: string): boolean {
    if (!this.isActive) return true;
    return this.config.enabledModules.includes(moduleName);
  }

  static isFeatureEnabled(feature: string): boolean {
    if (!this.isActive) return true;
    return !this.config.disableFeatures.includes(feature);
  }

  static getFallbackRoute(route: string): string {
    return this.config.fallbackRoutes[route] || '/wallet';
  }

  static getDiagnostics(): Record<string, any> {
    const state = kernel.getState();
    return {
      bootPhase: state.bootPhase,
      activeModules: Array.from(state.modules.entries()).map(([name, m]) => ({ name, status: m.status })),
      errors: state.errors,
      safeMode: this.isActive,
      config: this.config,
      uptime: Date.now() - state.startTime,
    };
  }

  static getConfig(): Readonly<SafeModeConfig> {
    return { ...this.config };
  }
}
