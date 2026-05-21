export type CaseStatus = 
  | 'reported' 
  | 'under_investigation' 
  | 'suspect_identified' 
  | 'suspect_arrested'
  | 'charges_filed' 
  | 'in_court' 
  | 'awaiting_trial' 
  | 'convicted' 
  | 'acquitted'
  | 'dismissed' 
  | 'closed' 
  | 'reopened' 
  | 'transferred' 
  | 'cold_case'

export type CaseType =
  | 'theft' | 'assault' | 'homicide' | 'robbery' | 'burglary'
  | 'fraud' | 'domestic_violence' | 'sexual_assault' | 'missing_person'
  | 'traffic_offense' | 'drug_offense' | 'terrorism' | 'corruption'
  | 'public_order' | 'property_damage' | 'noise_complaint' | 'civil_dispute'
  | 'child_protection' | 'animal_cruelty' | 'environmental' | 'cybercrime'

export type CasePriority = 'critical' | 'high' | 'medium' | 'low'

export type OfficerRank =
  | 'recruit' | 'constable' | 'corporal' | 'sergeant'
  | 'senior_sergeant' | 'inspector' | 'chief_inspector'
  | 'superintendent' | 'senior_superintendent' | 'commissioner'
  | 'assistant_commissioner' | 'deputy_commissioner' | 'inspector_general'

export type DutyStatus = 'off_duty' | 'on_duty' | 'on_patrol' | 'on_leave' | 'suspended' | 'arrested'

export interface PoliceOfficer {
  id: string
  badge_number: string
  profile_id: string
  station_id: string
  rank: OfficerRank
  department: string
  duty_status: DutyStatus
  radio_call_sign?: string
  full_name?: string
  phone?: string
  email?: string
  avatar_url?: string
  created_at: string
}

export interface PoliceCase {
  id: string
  case_number: string
  station_id: string
  country_id: string
  reporting_officer_id: string
  assigned_officer_id?: string
  supervising_officer_id?: string
  case_type: CaseType
  priority: CasePriority
  status: CaseStatus
  reporter_type: string
  reporter_name?: string
  reporter_phone?: string
  reporter_id_number?: string
  incident_location: string
  incident_location_coords?: { lat: number; lng: number }
  incident_datetime: string
  description: string
  evidence_photos: string[]
  evidence_videos: string[]
  evidence_documents: string[]
  witness_statements: WitnessStatement[]
  suspect_description?: string
  suspect_photos: string[]
  forwarded_to?: string
  forwarded_at?: string
  forwarding_notes?: string
  court_case_number?: string
  resolution_notes?: string
  resolved_at?: string
  created_at: string
  updated_at: string
  // Joined fields
  reporting_officer?: PoliceOfficer
  assigned_officer?: PoliceOfficer
  station?: PoliceStation
}

export interface WitnessStatement {
  name: string
  phone?: string
  statement: string
  recorded_at: string
}

export interface PoliceStation {
  id: string
  station_code: string
  name: string
  county_id: string
  address?: string
  phone?: string
  email?: string
  officer_count: number
  case_count: number
  is_active: boolean
}

export interface CaseTimelineEvent {
  id: string
  case_id: string
  officer_id: string
  action: string
  description?: string
  metadata?: Record<string, any>
  created_at: string
  officer?: PoliceOfficer
}

export interface EmergencyCall {
  id: string
  call_uuid: string
  caller_phone?: string
  caller_location?: { lat: number; lng: number }
  caller_name?: string
  emergency_type: string
  priority: CasePriority
  description: string
  dispatch_status: 'received' | 'dispatched' | 'en_route' | 'on_scene' | 'resolved' | 'false_alarm' | 'no_response'
  station_id: string
  created_at: string
}

export interface EvidenceItem {
  id: string
  case_id: string
  type: 'photo' | 'video' | 'document' | 'audio'
  url: string
  thumbnail_url?: string
  description?: string
  uploaded_by: string
  created_at: string
}

export interface CaseFilter {
  status?: CaseStatus
  case_type?: CaseType
  priority?: CasePriority
  assigned_to_me?: boolean
  date_from?: string
  date_to?: string
  search?: string
}
