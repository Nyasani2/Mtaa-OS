export interface ProcurementRequisition {
  id: string
  requisition_number: string
  title: string
  description: string
  estimated_cost: number
  ministry_id: string
  ministry_name: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'converted_to_tender'
  budget_allocation_id?: string
  submitted_at?: string
  approved_at?: string
  approved_by?: string
  created_by: string
  created_at: string
}

export interface TreasuryTender {
  id: string
  tender_number: string
  title: string
  description: string
  requisition_id?: string
  estimated_value: number
  tender_type: 'open' | 'restricted' | 'single_source' | 'emergency'
  publication_date?: string
  closing_date: string
  status: 'draft' | 'published' | 'under_evaluation' | 'awarded' | 'contracted' | 'cancelled'
  ocds_data?: Record<string, unknown>
  bid_count: number
  created_by: string
  created_at: string
}

export interface TreasuryContract {
  id: string
  contract_number: string
  tender_id?: string
  title: string
  contractor_name: string
  contract_value: number
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'completed' | 'terminated' | 'suspended'
  payment_progress: number
  time_progress: number
  performance_rating?: number
  ocds_data?: Record<string, unknown>
  created_by: string
  created_at: string
}

export interface TreasuryAsset {
  id: string
  asset_tag: string
  asset_name: string
  asset_category: string
  acquisition_cost: number
  accumulated_depreciation: number
  net_book_value: number
  depreciation_method: 'straight_line' | 'declining_balance' | 'units_of_production'
  useful_life_years: number
  condition: 'new' | 'good' | 'fair' | 'poor' | 'disposed'
  gps_coordinates?: string
  qr_code_hash?: string
  custody_officer_id?: string
  custody_officer_name?: string
  location: string
  acquisition_date: string
  created_by: string
  created_at: string
}

export interface AssetTransfer {
  id: string
  asset_id: string
  from_officer_id: string
  to_officer_id: string
  from_officer_name: string
  to_officer_name: string
  transfer_date: string
  reason: string
  approved_by?: string
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  created_at: string
}
