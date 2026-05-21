export const TREASURY_REGISTRY = {
  modules: ['budget', 'payments', 'debt-payroll', 'procurement', 'audit', 'reports'],
  endpoints: {
    dashboard: '/api/dashboard',
    audit: '/api/audit',
    feedback: '/api/feedback'
  },
  roles: ['treasury_admin', 'budget_officer', 'payment_officer', 'auditor', 'viewer']
} as const
