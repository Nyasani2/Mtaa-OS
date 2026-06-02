// asis/deployment/environments/prod.config.ts
// Production environment — strict, optimized, secure

export const prodConfig = {
  apiBaseUrl: 'https://api.mtaa.africa',
  supabaseUrl: 'https://db.mtaa.africa',
  supabaseAnonKey: process.env.PROD_ANON_KEY || '',
  debug: false,
  mockExternalServices: false,
  logLevel: 'error',
  featureFlags: {
    experimentalAgents: false,
    debugUI: false,
    mockPayments: false,
  },
};
