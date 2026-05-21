export const PROCUREMENT_REGISTRY = {
  requisitionStatuses: ['draft', 'submitted', 'under_review', 'approved', 'converted_to_tender'],
  tenderStatuses: ['draft', 'published', 'under_evaluation', 'awarded', 'contracted', 'cancelled'],
  contractStatuses: ['draft', 'active', 'completed', 'terminated', 'suspended'],
  assetConditions: ['new', 'good', 'fair', 'poor', 'disposed'],
  depreciationMethods: ['straight_line', 'declining_balance', 'units_of_production'],
  roles: ['procurement_admin', 'procurement_officer', 'evaluator', 'asset_manager', 'viewer']
} as const
