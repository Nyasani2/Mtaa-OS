// asis/deployment/environments/dev.config.ts
// Development environment overrides

export const devConfig = {
  apiBaseUrl: 'http://localhost:54321',
  supabaseUrl: 'http://localhost:54321',
  supabaseAnonKey: 'dev-anon-key',
  debug: true,
  mockExternalServices: true,
  logLevel: 'verbose',
  featureFlags: {
    experimentalAgents: true,
    debugUI: true,
    mockPayments: true,
  },
};
