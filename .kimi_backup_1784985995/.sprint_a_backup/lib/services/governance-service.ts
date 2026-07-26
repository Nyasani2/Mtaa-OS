import { supabase } from '@/lib/supabase';

// ============================================================
// GOVERNANCE SERVICE V2 — Aligned to MTAA Account System
// No separate account creation. Users register via MTAA auth,
// then roles are assigned to existing accounts.
// ============================================================

export interface GovernanceRole {
  id: string;
  user_id: string;
  role: 'senator' | 'mp' | 'mca' | 'governor' | 'cec' | 'county_clerk' | 'speaker' | 'deputy_speaker';
  county_id: string;
  constituency_id?: string;
  ward_id?: string;
  department?: string;
  committee_ids?: string[];
  term_start: string;
  term_end: string;
  is_active: boolean;
  created_at: string;
}

export interface Forum {
  id: string;
  county_id: string;
  forum_type: string;
  title: string;
  description?: string;
  scheduled_date: string;
  venue_name?: string;
  venue_address?: string;
  venue_location?: { lat: number; lng: number };
  virtual_link?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
}

export interface Petition {
  id: string;
  citizen_id: string;
  county_id: string;
  title: string;
  description: string;
  category: string;
  signatures_count: number;
  status: 'open' | 'closed' | 'responded';
  response?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
}

export interface Vote {
  id: string;
  motion_id: string;
  member_id: string;
  vote: 'yes' | 'no' | 'abstain';
  voted_at: string;
}

export interface WardProject {
  id: string;
  ward_id: string;
  title: string;
  description: string;
  budget_allocated: number;
  budget_spent: number;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  progress_percent: number;
  created_by: string;
  created_at: string;
}

// ============================================================
// CORE: Assign governance role to existing MTAA user
// ============================================================
export async function assignGovernanceRole(params: {
  user_id: string;
  role: GovernanceRole['role'];
  county_id: string;
  constituency_id?: string;
  ward_id?: string;
  department?: string;
  term_start: string;
  term_end: string;
  assigned_by: string;
}) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'assign_governance_role', ...params }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// FORUMS
// ============================================================
export async function createForum(params: Omit<Forum, 'id' | 'status' | 'created_at'>) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'create_forum', ...params }
  });
  if (error) throw error;
  return data;
}

export async function listForums(county_id: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'list_forums', county_id, limit }
  });
  if (error) throw error;
  return data;
}

export async function getForum(forum_id: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'get_forum', forum_id }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// PETITIONS
// ============================================================
export async function createPetition(params: Omit<Petition, 'id' | 'signatures_count' | 'status' | 'response' | 'responded_by' | 'responded_at' | 'created_at'>) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'create_petition', ...params }
  });
  if (error) throw error;
  return data;
}

export async function listPetitions(county_id: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'list_petitions', county_id, limit }
  });
  if (error) throw error;
  return data;
}

export async function signPetition(petition_id: string, citizen_id: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'sign_petition', petition_id, citizen_id }
  });
  if (error) throw error;
  return data;
}

export async function respondToPetition(petition_id: string, response: string, responded_by: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'respond_to_petition', petition_id, response, responded_by }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// VOTING
// ============================================================
export async function castVote(params: Omit<Vote, 'id' | 'voted_at'>) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'cast_vote', ...params }
  });
  if (error) throw error;
  return data;
}

export async function getVoteResults(motion_id: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'get_vote_results', motion_id }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// WARD PROJECTS
// ============================================================
export async function createWardProject(params: Omit<WardProject, 'id' | 'progress_percent' | 'created_at'>) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'create_ward_project', ...params }
  });
  if (error) throw error;
  return data;
}

export async function listWardProjects(ward_id: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'list_ward_projects', ward_id, limit }
  });
  if (error) throw error;
  return data;
}

export async function updateProjectProgress(project_id: string, progress_percent: number, budget_spent: number) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'update_project_progress', project_id, progress_percent, budget_spent }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// ROLE MANAGEMENT
// ============================================================
export async function getGovernanceRole(user_id: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'get_governance_role', user_id }
  });
  if (error) throw error;
  return data;
}

export async function listGovernanceMembers(county_id: string, role?: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'list_governance_members', county_id, role }
  });
  if (error) throw error;
  return data;
}

export async function revokeGovernanceRole(role_assignment_id: string, revoked_by: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'revoke_governance_role', role_assignment_id, revoked_by }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// ONBOARDING
// ============================================================
export async function getOnboardingStatus(user_id: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'get_onboarding_status', user_id }
  });
  if (error) throw error;
  return data;
}

export async function updateOnboardingStep(user_id: string, step: number, completed: boolean) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'update_onboarding_step', user_id, step, completed }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// BUDGET & BILLS
// ============================================================
export async function submitBill(params: {
  submitted_by: string;
  county_id: string;
  title: string;
  description: string;
  bill_text: string;
  category: string;
}) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'submit_bill', ...params }
  });
  if (error) throw error;
  return data;
}

export async function listBills(county_id: string, status?: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'list_bills', county_id, status, limit }
  });
  if (error) throw error;
  return data;
}

export async function submitBudget(county_id: string, fiscal_year: string, budget_data: any, submitted_by: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'submit_budget', county_id, fiscal_year, budget_data, submitted_by }
  });
  if (error) throw error;
  return data;
}

export async function approveBudget(budget_id: string, approved_by: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'approve_budget', budget_id, approved_by }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// CITIZEN Q&A
// ============================================================
export async function submitQuestion(params: {
  citizen_id: string;
  county_id: string;
  representative_id: string;
  question: string;
  category?: string;
}) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'submit_question', ...params }
  });
  if (error) throw error;
  return data;
}

export async function answerQuestion(question_id: string, answer: string, answered_by: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'answer_question', question_id, answer, answered_by }
  });
  if (error) throw error;
  return data;
}

export async function listQuestions(county_id: string, representative_id?: string, status?: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'list_questions', county_id, representative_id, status, limit }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// PUBLIC PARTICIPATION
// ============================================================
export async function createPublicParticipationEvent(params: {
  county_id: string;
  event_type: string;
  title: string;
  description: string;
  scheduled_date: string;
  venue_name?: string;
  venue_address?: string;
  virtual_link?: string;
  created_by: string;
}) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'create_public_participation_event', ...params }
  });
  if (error) throw error;
  return data;
}

export async function registerForEvent(event_id: string, citizen_id: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'register_for_event', event_id, citizen_id }
  });
  if (error) throw error;
  return data;
}

// ============================================================
// COMMITTEES
// ============================================================
export async function createCommittee(params: {
  county_id: string;
  name: string;
  description?: string;
  committee_type: string;
  chair_id: string;
  created_by: string;
}) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'create_committee', ...params }
  });
  if (error) throw error;
  return data;
}

export async function addCommitteeMember(committee_id: string, member_id: string, role_in_committee: string, added_by: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'add_committee_member', committee_id, member_id, role_in_committee, added_by }
  });
  if (error) throw error;
  return data;
}

export async function listCommittees(county_id: string) {
  const { data, error } = await supabase.functions.invoke('governance-operations', {
    body: { action: 'list_committees', county_id }
  });
  if (error) throw error;
  return data;
}
