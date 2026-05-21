export const DEBT_PAYROLL_REGISTRY = {
  debtTypes: ['bilateral', 'multilateral', 'commercial', 't_bills', 't_bonds', 'sukuk', 'guarantees'],
  debtStatuses: ['active', 'repaid', 'defaulted', 'restructured', 'cancelled'],
  payrollStatuses: ['draft', 'processing', 'approved', 'paid', 'reversed'],
  forecastTypes: ['cash', 'revenue'],
  roles: ['debt_admin', 'payroll_admin', 'forecast_officer', 'viewer']
} as const
