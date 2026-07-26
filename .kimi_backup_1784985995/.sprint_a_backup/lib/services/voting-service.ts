import { supabase } from '@/lib/supabase';

// ============================================================
// MTAA UNIVERSAL VOTING ENGINE — Frontend Service
// Supports: Ward, MCA, Senate, MP, Governor, Presidential,
//           African Supreme Leader, SACCO, Custom Elections
// ============================================================

export interface Election {
  id: string;
  title: string;
  description?: string;
  slug: string;
  election_type: 'ward_project' | 'mca' | 'senator' | 'mp' | 'governor' | 'president' | 'african_supreme_leader' | 'sacco' | 'referendum' | 'custom';
  jurisdiction_type: 'ward' | 'constituency' | 'county' | 'national' | 'continental' | 'organization' | 'custom';
  ward_id?: string;
  constituency_id?: string;
  county_id?: string;
  country_code: string;
  organization_id?: string;
  registration_opens_at?: string;
  registration_closes_at?: string;
  voting_starts_at: string;
  voting_ends_at: string;
  results_announced_at?: string;
  voting_method: 'single_choice' | 'multiple_choice' | 'ranked_choice' | 'approval' | 'score' | 'yes_no' | 'project_priority';
  max_choices: number;
  min_choices: number;
  minimum_age: number;
  requires_verification: boolean;
  eligibility_rules: any;
  status: 'draft' | 'registering' | 'voting' | 'counting' | 'completed' | 'cancelled' | 'disputed';
  total_registered_voters: number;
  total_votes_cast: number;
  turnout_percentage: number;
  winner_id?: string;
  results: any;
  created_by: string;
  administered_by: string[];
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ElectionCandidate {
  id: string;
  election_id: string;
  candidate_type: 'person' | 'project' | 'option' | 'party';
  profile_id?: string;
  candidate_name: string;
  candidate_bio?: string;
  candidate_photo_url?: string;
  party_affiliation?: string;
  party_logo_url?: string;
  project_id?: string;
  option_label?: string;
  option_description?: string;
  ballot_number?: number;
  manifesto?: string;
  campaign_promises: any[];
  campaign_media: any[];
  votes_received: number;
  vote_percentage: number;
  rank_position?: number;
  is_winner: boolean;
  is_approved: boolean;
  is_disqualified: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ElectionVoter {
  id: string;
  election_id: string;
  profile_id: string;
  user_id: string;
  is_verified: boolean;
  verified_at?: string;
  verification_method?: string;
  eligibility_status: 'pending' | 'eligible' | 'ineligible' | 'challenged';
  has_voted: boolean;
  voted_at?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface VoteCast {
  candidate_id: string;
  rank_position?: number;
  score?: number;
  is_approved?: boolean;
  metadata?: any;
}

export interface ElectionResults {
  election: Election;
  results: {
    candidate_id: string;
    candidate_name: string;
    votes_received: number;
    vote_percentage: number;
  }[];
  total_votes_cast: number;
  total_registered_voters: number;
  turnout_percentage: number;
}

// ============================================================
// ELECTION MANAGEMENT
// ============================================================

export async function createElection(params: Omit<Election, 'id' | 'slug' | 'status' | 'total_registered_voters' | 'total_votes_cast' | 'turnout_percentage' | 'winner_id' | 'results' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'create_election', ...params }
  });
  if (error) throw error;
  return data;
}

export async function getElection(election_id: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'get_election', election_id }
  });
  if (error) throw error;
  return data;
}

export async function listElections(filters?: {
  election_type?: string;
  status?: string;
  county_id?: string;
  constituency_id?: string;
  ward_id?: string;
  organization_id?: string;
  jurisdiction_type?: string;
  limit?: number;
}) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'list_elections', ...filters }
  });
  if (error) throw error;
  return data;
}

export async function updateElectionStatus(election_id: string, status: Election['status']) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'update_election_status', election_id, status }
  });
  if (error) throw error;
  return data;
}

export async function publishElection(election_id: string, registration_opens_at?: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'publish_election', election_id, registration_opens_at }
  });
  if (error) throw error;
  return data;
}

export async function startVoting(election_id: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'start_voting', election_id }
  });
  if (error) throw error;
  return data;
}

export async function endVoting(election_id: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'end_voting', election_id }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// CANDIDATE MANAGEMENT
// ============================================================

export async function registerCandidate(params: Omit<ElectionCandidate, 'id' | 'votes_received' | 'vote_percentage' | 'rank_position' | 'is_winner' | 'is_approved' | 'is_disqualified' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'register_candidate', ...params }
  });
  if (error) throw error;
  return data;
}

export async function approveCandidate(candidate_id: string, approved_by: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'approve_candidate', candidate_id, approved_by }
  });
  if (error) throw error;
  return data;
}

export async function disqualifyCandidate(candidate_id: string, reason: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'disqualify_candidate', candidate_id, reason }
  });
  if (error) throw error;
  return data;
}

export async function listCandidates(election_id: string, approved_only = true) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'list_candidates', election_id, approved_only }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// VOTER REGISTRATION
// ============================================================

export async function registerVoter(election_id: string, profile_id: string, user_id: string, auto_verify = false) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'register_voter', election_id, profile_id, user_id, auto_verify }
  });
  if (error) throw error;
  return data;
}

export async function verifyVoter(voter_id: string, verified_by: string, method?: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'verify_voter', voter_id, verified_by, method }
  });
  if (error) throw error;
  return data;
}

export async function checkVoterStatus(election_id: string, user_id: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'check_voter_status', election_id, user_id }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// VOTE CASTING
// ============================================================

export async function castVote(election_id: string, user_id: string, profile_id: string, votes: VoteCast[]) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'cast_vote', election_id, user_id, profile_id, votes }
  });
  if (error) throw error;
  return data;
}

// Convenience: Cast single-choice vote
export async function castSingleVote(election_id: string, user_id: string, profile_id: string, candidate_id: string) {
  return castVote(election_id, user_id, profile_id, [{ candidate_id }]);
}

// Convenience: Cast ranked-choice vote
export async function castRankedVote(election_id: string, user_id: string, profile_id: string, rankedCandidates: { candidate_id: string; rank: number }[]) {
  return castVote(election_id, user_id, profile_id, rankedCandidates.map(c => ({ candidate_id: c.candidate_id, rank_position: c.rank })));
}

// Convenience: Cast approval vote
export async function castApprovalVote(election_id: string, user_id: string, profile_id: string, approvedCandidateIds: string[]) {
  return castVote(election_id, user_id, profile_id, approvedCandidateIds.map(id => ({ candidate_id: id, is_approved: true })));
}

// Convenience: Cast score vote
export async function castScoreVote(election_id: string, user_id: string, profile_id: string, scoredCandidates: { candidate_id: string; score: number }[]) {
  return castVote(election_id, user_id, profile_id, scoredCandidates.map(c => ({ candidate_id: c.candidate_id, score: c.score })));
}

// ============================================================
// RESULTS
// ============================================================

export async function getResults(election_id: string): Promise<ElectionResults> {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'get_results', election_id }
  });
  if (error) throw error;
  return data;
}

export async function getRankedResults(election_id: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'get_ranked_results', election_id }
  });
  if (error) throw error;
  return data;
}

export async function announceResults(election_id: string, winner_id?: string, results?: any) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'announce_results', election_id, winner_id, results }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// AUDIT & VERIFICATION
// ============================================================

export async function verifyOwnVote(election_id: string, profile_id: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'verify_vote', election_id, profile_id }
  });
  if (error) throw error;
  return data;
}

export async function getAuditLog(election_id: string, limit = 100) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'get_audit_log', election_id, limit }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// INCIDENTS
// ============================================================

export async function reportIncident(params: {
  election_id: string;
  reported_by: string;
  incident_type: string;
  description: string;
  location?: string;
  lat?: number;
  lng?: number;
  evidence_urls?: string[];
}) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'report_incident', ...params }
  });
  if (error) throw error;
  return data;
}

export async function listIncidents(election_id: string) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'list_incidents', election_id }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// OBSERVERS
// ============================================================

export async function registerObserver(params: {
  election_id: string;
  profile_id: string;
  observer_type: string;
  organization_name?: string;
  accreditation_number?: string;
}) {
  const { data, error } = await supabase.functions.invoke('voting-engine', {
    body: { action: 'register_observer', ...params }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// CONVENIENCE: ELECTION LIFECYCLE
// ============================================================

export async function runElectionLifecycle(election_id: string, admin_id: string) {
  // Step 1: Publish (open registration)
  await publishElection(election_id);

  // Step 2: Start voting (when ready)
  // await startVoting(election_id);

  // Step 3: End voting (when time is up)
  // await endVoting(election_id);

  // Step 4: Get results
  // const results = await getResults(election_id);

  // Step 5: Announce
  // await announceResults(election_id, winner_id, results);

  return { success: true, message: "Election published. Next steps: start voting → end voting → announce results." };
}

// ============================================================
// CONVENIENCE: ELECTION TYPES
// ============================================================

export async function createWardProjectVote(params: {
  title: string;
  description?: string;
  ward_id: string;
  county_id: string;
  voting_starts_at: string;
  voting_ends_at: string;
  created_by: string;
  projects: { project_id: string; project_name: string; description: string }[];
}) {
  // Create election
  const { data: election } = await createElection({
    title: params.title,
    description: params.description,
    election_type: 'ward_project',
    jurisdiction_type: 'ward',
    ward_id: params.ward_id,
    county_id: params.county_id,
    voting_starts_at: params.voting_starts_at,
    voting_ends_at: params.voting_ends_at,
    voting_method: 'project_priority',
    max_choices: params.projects.length,
    min_choices: 1,
    created_by: params.created_by,
    administered_by: [params.created_by]
  });

  // Register projects as candidates
  for (const project of params.projects) {
    await registerCandidate({
      election_id: election.data.id,
      candidate_type: 'project',
      project_id: project.project_id,
      candidate_name: project.project_name,
      option_description: project.description,
      ballot_number: params.projects.indexOf(project) + 1
    });
  }

  return election;
}

export async function createSaccoElection(params: {
  title: string;
  description?: string;
  organization_id: string;
  voting_starts_at: string;
  voting_ends_at: string;
  created_by: string;
  positions: { position_name: string; candidates: { profile_id: string; candidate_name: string }[] }[];
}) {
  const elections = [];

  for (const position of params.positions) {
    const { data: election } = await createElection({
      title: `${params.title} — ${position.position_name}`,
      description: params.description,
      election_type: 'sacco',
      jurisdiction_type: 'organization',
      organization_id: params.organization_id,
      voting_starts_at: params.voting_starts_at,
      voting_ends_at: params.voting_ends_at,
      voting_method: 'single_choice',
      max_choices: 1,
      min_choices: 1,
      created_by: params.created_by,
      administered_by: [params.created_by]
    });

    for (const candidate of position.candidates) {
      await registerCandidate({
        election_id: election.data.id,
        candidate_type: 'person',
        profile_id: candidate.profile_id,
        candidate_name: candidate.candidate_name,
        ballot_number: position.candidates.indexOf(candidate) + 1
      });
    }

    elections.push(election);
  }

  return { success: true, elections };
}

export async function createPresidentialElection(params: {
  title: string;
  description?: string;
  country_code: string;
  voting_starts_at: string;
  voting_ends_at: string;
  created_by: string;
  candidates: { profile_id: string; candidate_name: string; party_affiliation?: string; manifesto?: string }[];
}) {
  const { data: election } = await createElection({
    title: params.title,
    description: params.description,
    election_type: 'president',
    jurisdiction_type: 'national',
    country_code: params.country_code,
    voting_starts_at: params.voting_starts_at,
    voting_ends_at: params.voting_ends_at,
    voting_method: 'single_choice',
    max_choices: 1,
    min_choices: 1,
    created_by: params.created_by,
    administered_by: [params.created_by]
  });

  for (const candidate of params.candidates) {
    await registerCandidate({
      election_id: election.data.id,
      candidate_type: 'person',
      profile_id: candidate.profile_id,
      candidate_name: candidate.candidate_name,
      party_affiliation: candidate.party_affiliation,
      manifesto: candidate.manifesto,
      ballot_number: params.candidates.indexOf(candidate) + 1
    });
  }

  return election;
}

export async function createAfricanSupremeLeaderElection(params: {
  title: string;
  description?: string;
  voting_starts_at: string;
  voting_ends_at: string;
  created_by: string;
  candidates: { profile_id: string; candidate_name: string; country_code: string; manifesto?: string }[];
}) {
  const { data: election } = await createElection({
    title: params.title,
    description: params.description,
    election_type: 'african_supreme_leader',
    jurisdiction_type: 'continental',
    country_code: 'AF',
    voting_starts_at: params.voting_starts_at,
    voting_ends_at: params.voting_ends_at,
    voting_method: 'single_choice',
    max_choices: 1,
    min_choices: 1,
    created_by: params.created_by,
    administered_by: [params.created_by]
  });

  for (const candidate of params.candidates) {
    await registerCandidate({
      election_id: election.data.id,
      candidate_type: 'person',
      profile_id: candidate.profile_id,
      candidate_name: candidate.candidate_name,
      manifesto: candidate.manifesto,
      ballot_number: params.candidates.indexOf(candidate) + 1
    });
  }

  return election;
}
