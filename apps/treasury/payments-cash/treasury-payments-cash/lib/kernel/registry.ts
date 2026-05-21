export const PAYMENTS_REGISTRY = {
  modules: ['expenditures', 'tsa', 'revenue', 'reconciliation', 'smart-contracts'],
  expenditureStatuses: ['pending', 'approved', 'processed', 'paid'],
  tsaTypes: ['receipt', 'payment', 'transfer', 'reversal'],
  revenueSources: ['tax', 'non_tax', 'fees', 'fines', 'grants', 'loans', 'dividends', 'rent'],
  contractStatuses: ['draft', 'deployed', 'active', 'paused', 'terminated'],
  roles: ['payment_admin', 'payment_officer', 'revenue_officer', 'auditor', 'viewer']
} as const
