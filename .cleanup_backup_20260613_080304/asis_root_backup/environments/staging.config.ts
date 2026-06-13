// asis/deployment/environments/staging.config.ts
// Staging environment — production-like with test integrations

export const stagingConfig = {
  apiBaseUrl: 'https://staging-api.mtaa.africa',
  supabaseUrl: 'https://staging-db.mtaa.africa',
  supabaseAnonKey: process.env.STAGING_ANON_KEY || '',
  debug: false,
  mockExternalServices: false,
  logLevel: 'info',
  featureFlags: {
    experimentalAgents: true,
    debugUI: false,
    mockPayments: false,
  },
};
