export type ElectionStatus = 'upcoming' | 'active' | 'closed' | 'cancelled';
export type ElectionType =
  | 'presidential' | 'governor' | 'senator' | 'mp' | 'mca'
  | 'ward_project' | 'sacco' | 'referendum' | 'custom';
export type VotingMethod =
  | 'single_choice' | 'multiple_choice' | 'ranked_choice'
  | 'approval' | 'score' | 'yes_no';
export type JurisdictionLevel =
  | 'national' | 'county' | 'constituency' | 'ward' | 'sacco' | 'custom';
export type CandidateStatus = 'pending' | 'approved' | 'disqualified';
export type IncidentType =
  | 'fraud' | 'intimidation' | 'system_failure'
  | 'counting_error' | 'access_denied' | 'other';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface VotingElection {
  id: string;
  title: string;
  description?: string;
  election_type: ElectionType;
  voting_method: VotingMethod;
  jurisdiction_level: JurisdictionLevel;
  start_date: string;
  end_date: string;
  min_age: number;
  is_public: boolean;
  quorum_required: boolean;
  status: ElectionStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  total_votes_cast?: number;
  total_registered_voters?: number;
  user_registered?: boolean;
}

export interface VotingCandidate {
  id: string;
  election_id: string;
  election_title?: string;
  name: string;
  party_affiliation?: string;
  bio?: string;
  manifesto?: string;
  promises?: string[];
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  status: CandidateStatus;
  created_at: string;
}

export interface VoteChoice {
  candidate_id: string;
  rank?: number;
  score?: number;
  approved?: boolean;
}

export interface VotingResult {
  candidate_id: string;
  candidate_name: string;
  party_affiliation?: string;
  vote_count: number;
  percentage: number;
}

export interface ElectionResultsResponse {
  election_id: string;
  total_votes: number;
  results: VotingResult[];
}

export interface VoteVerificationResponse {
  verified: boolean;
  hash?: string;
  election_title?: string;
  cast_at?: string;
}

export interface AuditLogEntry {
  id: string;
  election_id: string;
  action: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface IncidentReport {
  id: string;
  election_id: string;
  incident_type: IncidentType;
  description: string;
  location?: string;
  reporter_contact?: string;
  status: IncidentStatus;
  severity?: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface VoterRegistrationInput {
  full_name: string;
  id_number: string;
  phone: string;
  email?: string;
  ward?: string;
  constituency?: string;
  county?: string;
  date_of_birth?: string;
}

export interface CreateElectionInput {
  title: string;
  description?: string;
  election_type: ElectionType;
  voting_method: VotingMethod;
  jurisdiction_level: JurisdictionLevel;
  start_date: string;
  end_date: string;
  min_age?: number;
  is_public?: boolean;
  quorum_required?: boolean;
}

export interface AddCandidateInput {
  election_id: string;
  name: string;
  party_affiliation?: string;
  bio?: string;
  manifesto?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface ReportIncidentInput {
  election_id: string;
  incident_type: IncidentType;
  description: string;
  location?: string;
  reporter_contact?: string;
}

export interface VoterRecord {
  id: string;
  election_id: string;
  user_id?: string;
  name?: string;
  id_number?: string;
  phone?: string;
  email?: string;
  ward?: string;
  constituency?: string;
  county?: string;
  verified: boolean;
  created_at: string;
}
