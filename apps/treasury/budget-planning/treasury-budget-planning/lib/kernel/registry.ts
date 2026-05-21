export const BUDGET_REGISTRY = {
  modules: ['cycles', 'allocations', 'warrants', 'commitments', 'liquidations', 'approvals', 'delegations'],
  budgetStatuses: ['draft', 'submitted', 'approved', 'active', 'closed'],
  warrantStatuses: ['draft', 'issued', 'partially_spent', 'fully_spent', 'expired', 'cancelled'],
  commitmentStatuses: ['draft', 'approved', 'committed', 'liquidated', 'cancelled'],
  roles: ['budget_admin', 'budget_officer', 'approver', 'viewer']
} as const
