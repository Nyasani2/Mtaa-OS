// asis/deployment/environment-config.ts
// Per-environment system behavior configuration

export interface EnvironmentConfig {
  name: 'dev' | 'staging' | 'prod';
  debug: boolean;
  logLevel: 'verbose' | 'info' | 'warn' | 'error';
  safetyThresholds: {
    maxAgentConcurrency: number;
    maxMemoryAllocationMB: number;
    maxRequestTimeoutMs: number;
    circuitBreakerThreshold: number;
  };
  features: {
    testIntegrations: boolean;
    mockServices: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
  security: {
    encryption: boolean;
    certificatePinning: boolean;
    strictCors: boolean;
    auditLog: boolean;
  };
  performance: {
    lazyLoad: boolean;
    cacheEnabled: boolean;
    compression: boolean;
    prefetch: boolean;
  };
}

const CONFIGS: Record<string, EnvironmentConfig> = {
  dev: {
    name: 'dev',
    debug: true,
    logLevel: 'verbose',
    safetyThresholds: {
      maxAgentConcurrency: 10,
      maxMemoryAllocationMB: 512,
      maxRequestTimeoutMs: 30000,
      circuitBreakerThreshold: 10,
    },
    features: {
      testIntegrations: true,
      mockServices: true,
      analytics: false,
      crashReporting: false,
    },
    security: {
      encryption: false,
      certificatePinning: false,
      strictCors: false,
      auditLog: false,
    },
    performance: {
      lazyLoad: false,
      cacheEnabled: false,
      compression: false,
      prefetch: false,
    },
  },

  staging: {
    name: 'staging',
    debug: false,
    logLevel: 'info',
    safetyThresholds: {
      maxAgentConcurrency: 5,
      maxMemoryAllocationMB: 256,
      maxRequestTimeoutMs: 15000,
      circuitBreakerThreshold: 5,
    },
    features: {
      testIntegrations: true,
      mockServices: false,
      analytics: true,
      crashReporting: true,
    },
    security: {
      encryption: true,
      certificatePinning: true,
      strictCors: true,
      auditLog: true,
    },
    performance: {
      lazyLoad: true,
      cacheEnabled: true,
      compression: true,
      prefetch: true,
    },
  },

  prod: {
    name: 'prod',
    debug: false,
    logLevel: 'error',
    safetyThresholds: {
      maxAgentConcurrency: 3,
      maxMemoryAllocationMB: 128,
      maxRequestTimeoutMs: 10000,
      circuitBreakerThreshold: 3,
    },
    features: {
      testIntegrations: false,
      mockServices: false,
      analytics: true,
      crashReporting: true,
    },
    security: {
      encryption: true,
      certificatePinning: true,
      strictCors: true,
      auditLog: true,
    },
    performance: {
      lazyLoad: true,
      cacheEnabled: true,
      compression: true,
      prefetch: true,
    },
  },
};

class EnvironmentConfiguration {
  private current: EnvironmentConfig = CONFIGS.dev;

  load(env: 'dev' | 'staging' | 'prod') {
    this.current = CONFIGS[env];
    // Apply to global ASIS config
    (globalThis as any).__ASIS_ENV_CONFIG__ = this.current;
    console.log(`[ASIS] Environment loaded: ${env}`);
  }

  get(): EnvironmentConfig {
    return this.current;
  }

  isDev(): boolean {
    return this.current.name === 'dev';
  }

  isProd(): boolean {
    return this.current.name === 'prod';
  }
}

export const environmentConfig = new EnvironmentConfiguration();
