// ============================================================
// MTAA OS V10 - Jobs Service
// 31 tables: jobs, job_applications, work_profiles, etc.
// ============================================================

import { supabase } from '@/lib/supabase';

// ─── Types ───
export interface Job {
  id: string; employer_id: string; title: string; description: string; requirements?: string;
  location?: string; salary_min?: number; salary_max?: number; salary_currency?: string;
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote';
  category?: string; status: 'active' | 'paused' | 'closed' | 'filled'; views?: number;
  applications_count?: number; expires_at?: string; created_at?: string;
}

export interface JobApplication {
  id: string; job_id: string; applicant_id: string; cover_letter?: string; resume_url?: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired' | 'withdrawn';
  applied_at?: string; updated_at?: string;
}

export interface WorkProfile {
  id: string; user_id: string; headline?: string; summary?: string; skills?: string[];
  experience_years?: number; preferred_location?: string; preferred_salary_min?: number;
  preferred_salary_max?: number; availability?: string; status?: string; created_at?: string;
}

export interface WorkExperience {
  id: string; profile_id: string; company_name: string; job_title: string; description?: string;
  start_date?: string; end_date?: string; is_current?: boolean; location?: string; created_at?: string;
}

export interface Education {
  id: string; profile_id: string; institution: string; degree: string; field_of_study?: string;
  start_date?: string; end_date?: string; is_current?: boolean; grade?: string; created_at?: string;
}

export interface Skill {
  id: string; profile_id: string; skill_name: string; proficiency?: string; years_experience?: number;
  verified?: boolean; created_at?: string;
}

export interface Certification {
  id: string; profile_id: string; name: string; issuing_organization?: string; issue_date?: string;
  expiry_date?: string; credential_url?: string; created_at?: string;
}

export interface PortfolioItem {
  id: string; profile_id: string; title: string; description?: string; project_url?: string;
  image_url?: string; created_at?: string;
}

export interface EmployerProfile {
  id: string; user_id: string; company_name: string; description?: string; industry?: string;
  company_size?: string; website?: string; logo_url?: string; location?: string; status?: string; created_at?: string;
}

export interface Interview {
  id: string; application_id: string; interviewer_id?: string; scheduled_at?: string;
  location?: string; meeting_url?: string; status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string; created_at?: string;
}

export interface JobAlert {
  id: string; user_id: string; keywords?: string; location?: string; category?: string;
  salary_min?: number; salary_max?: number; frequency?: string; status?: string; created_at?: string;
}

export interface SavedJob {
  id: string; user_id: string; job_id: string; saved_at?: string;
}

export interface JobCategory {
  id: string; name: string; description?: string; icon?: string; job_count?: number; status?: string;
}

export interface JobReview {
  id: string; job_id?: string; employer_id?: string; reviewer_id: string; rating: number;
  comment?: string; created_at?: string;
}

export interface Contract {
  id: string; job_id: string; employer_id: string; employee_id: string; start_date?: string;
  end_date?: string; salary?: number; terms?: any; status: 'draft' | 'active' | 'completed' | 'terminated';
  created_at?: string;
}

export interface Timesheet {
  id: string; contract_id: string; employee_id: string; date: string; hours_worked: number;
  description?: string; status?: string; created_at?: string;
}

export interface Payroll {
  id: string; contract_id: string; employee_id: string; period_start?: string; period_end?: string;
  hours_worked?: number; hourly_rate?: number; gross_pay?: number; deductions?: number; net_pay?: number;
  status?: string; paid_at?: string; created_at?: string;
}

export interface JobMessage {
  id: string; sender_id: string; receiver_id: string; job_id?: string; application_id?: string;
  content: string; status?: string; created_at?: string;
}

export interface JobReferral {
  id: string; referrer_id: string; referee_id: string; job_id: string; status?: string; created_at?: string;
}

export interface JobReport {
  id: string; reporter_id: string; job_id: string; reason: string; description?: string; status?: string; created_at?: string;
}

export interface JobAnalytics {
  id: string; job_id: string; views?: number; applications?: number; clicks?: number; date?: string; created_at?: string;
}

export interface CompanyReview {
  id: string; company_id: string; reviewer_id: string; rating: number; title?: string; comment?: string;
  pros?: string; cons?: string; created_at?: string;
}

export interface JobBenefit {
  id: string; job_id: string; benefit_type: string; description?: string; created_at?: string;
}

export interface JobRequirement {
  id: string; job_id: string; requirement: string; is_mandatory?: boolean; created_at?: string;
}

export interface JobQuestion {
  id: string; job_id: string; question: string; question_type?: string; is_required?: boolean; created_at?: string;
}

export interface JobAnswer {
  id: string; question_id: string; application_id: string; answer: string; created_at?: string;
}

export interface JobOffer {
  id: string; application_id: string; salary?: number; start_date?: string; benefits?: any;
  status: 'pending' | 'accepted' | 'rejected' | 'expired'; created_at?: string;
}

export interface JobBookmark {
  id: string; user_id: string; job_id: string; created_at?: string;
}

export interface JobSearch {
  id: string; user_id: string; query?: string; filters?: any; results_count?: number; created_at?: string;
}

export interface JobNotification {
  id: string; user_id: string; title: string; message: string; type?: string; status?: string; created_at?: string;
}

export interface JobSkillMatch {
  id: string; job_id: string; skill_name: string; importance?: number; created_at?: string;
}

// ─── Helper ───
function handleError(err: any, fallback: any = null) {
  console.error('[JobsService]', err?.message || err);
  return fallback;
}

// ─── JOBS ───
export async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getJobsByEmployer(employerId: string): Promise<Job[]> {
  const { data, error } = await supabase.from('jobs').select('*').eq('employer_id', employerId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getJobsByCategory(category: string): Promise<Job[]> {
  const { data, error } = await supabase.from('jobs').select('*').eq('category', category).eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function searchJobs(query: string): Promise<Job[]> {
  const { data, error } = await supabase.from('jobs').select('*').or(`title.ilike.%${query}%,description.ilike.%${query}%`).eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function createJob(data: Partial<Job>): Promise<Job | null> {
  const { data: result, error } = await supabase.from('jobs').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateJob(id: string, data: Partial<Job>): Promise<Job | null> {
  const { data: result, error } = await supabase.from('jobs').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJob(id: string): Promise<boolean> {
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB APPLICATIONS ───
export async function getApplications(): Promise<JobApplication[]> {
  const { data, error } = await supabase.from('job_applications').select('*').order('applied_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getApplicationById(id: string): Promise<JobApplication | null> {
  const { data, error } = await supabase.from('job_applications').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
  const { data, error } = await supabase.from('job_applications').select('*').eq('job_id', jobId).order('applied_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getApplicationsByApplicant(applicantId: string): Promise<JobApplication[]> {
  const { data, error } = await supabase.from('job_applications').select('*').eq('applicant_id', applicantId).order('applied_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function applyToJob(data: Partial<JobApplication>): Promise<JobApplication | null> {
  const { data: result, error } = await supabase.from('job_applications').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateApplication(id: string, data: Partial<JobApplication>): Promise<JobApplication | null> {
  const { data: result, error } = await supabase.from('job_applications').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteApplication(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_applications').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── WORK PROFILES ───
export async function getWorkProfiles(): Promise<WorkProfile[]> {
  const { data, error } = await supabase.from('work_profiles').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getWorkProfileById(id: string): Promise<WorkProfile | null> {
  const { data, error } = await supabase.from('work_profiles').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getWorkProfileByUserId(userId: string): Promise<WorkProfile | null> {
  const { data, error } = await supabase.from('work_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function upsertWorkProfile(data: Partial<WorkProfile>): Promise<WorkProfile | null> {
  if (data.user_id) {
    const existing = await getWorkProfileByUserId(data.user_id);
    if (existing) return updateWorkProfile(existing.id, data);
  }
  const { data: result, error } = await supabase.from('work_profiles').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateWorkProfile(id: string, data: Partial<WorkProfile>): Promise<WorkProfile | null> {
  const { data: result, error } = await supabase.from('work_profiles').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteWorkProfile(id: string): Promise<boolean> {
  const { error } = await supabase.from('work_profiles').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── WORK EXPERIENCE ───
export async function getWorkExperiences(profileId: string): Promise<WorkExperience[]> {
  const { data, error } = await supabase.from('work_experiences').select('*').eq('profile_id', profileId).order('start_date', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createWorkExperience(data: Partial<WorkExperience>): Promise<WorkExperience | null> {
  const { data: result, error } = await supabase.from('work_experiences').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateWorkExperience(id: string, data: Partial<WorkExperience>): Promise<WorkExperience | null> {
  const { data: result, error } = await supabase.from('work_experiences').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteWorkExperience(id: string): Promise<boolean> {
  const { error } = await supabase.from('work_experiences').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── EDUCATION ───
export async function getEducations(profileId: string): Promise<Education[]> {
  const { data, error } = await supabase.from('education_entries').select('*').eq('profile_id', profileId).order('start_date', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createEducation(data: Partial<Education>): Promise<Education | null> {
  const { data: result, error } = await supabase.from('education_entries').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateEducation(id: string, data: Partial<Education>): Promise<Education | null> {
  const { data: result, error } = await supabase.from('education_entries').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteEducation(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_entries').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── SKILLS ───
export async function getSkills(profileId: string): Promise<Skill[]> {
  const { data, error } = await supabase.from('skills').select('*').eq('profile_id', profileId);
  if (error) return handleError(error, []); return data || [];
}
export async function createSkill(data: Partial<Skill>): Promise<Skill | null> {
  const { data: result, error } = await supabase.from('skills').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateSkill(id: string, data: Partial<Skill>): Promise<Skill | null> {
  const { data: result, error } = await supabase.from('skills').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteSkill(id: string): Promise<boolean> {
  const { error } = await supabase.from('skills').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── CERTIFICATIONS ───
export async function getCertifications(profileId: string): Promise<Certification[]> {
  const { data, error } = await supabase.from('certifications').select('*').eq('profile_id', profileId);
  if (error) return handleError(error, []); return data || [];
}
export async function createCertification(data: Partial<Certification>): Promise<Certification | null> {
  const { data: result, error } = await supabase.from('certifications').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateCertification(id: string, data: Partial<Certification>): Promise<Certification | null> {
  const { data: result, error } = await supabase.from('certifications').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteCertification(id: string): Promise<boolean> {
  const { error } = await supabase.from('certifications').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── PORTFOLIO ───
export async function getPortfolioItems(profileId: string): Promise<PortfolioItem[]> {
  const { data, error } = await supabase.from('portfolio_items').select('*').eq('profile_id', profileId);
  if (error) return handleError(error, []); return data || [];
}
export async function createPortfolioItem(data: Partial<PortfolioItem>): Promise<PortfolioItem | null> {
  const { data: result, error } = await supabase.from('portfolio_items').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updatePortfolioItem(id: string, data: Partial<PortfolioItem>): Promise<PortfolioItem | null> {
  const { data: result, error } = await supabase.from('portfolio_items').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deletePortfolioItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── EMPLOYER PROFILES ───
export async function getEmployerProfiles(): Promise<EmployerProfile[]> {
  const { data, error } = await supabase.from('employer_profiles').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getEmployerProfileById(id: string): Promise<EmployerProfile | null> {
  const { data, error } = await supabase.from('employer_profiles').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getEmployerProfileByUserId(userId: string): Promise<EmployerProfile | null> {
  const { data, error } = await supabase.from('employer_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createEmployerProfile(data: Partial<EmployerProfile>): Promise<EmployerProfile | null> {
  const { data: result, error } = await supabase.from('employer_profiles').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateEmployerProfile(id: string, data: Partial<EmployerProfile>): Promise<EmployerProfile | null> {
  const { data: result, error } = await supabase.from('employer_profiles').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteEmployerProfile(id: string): Promise<boolean> {
  const { error } = await supabase.from('employer_profiles').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── INTERVIEWS ───
export async function getInterviews(): Promise<Interview[]> {
  const { data, error } = await supabase.from('interviews').select('*').order('scheduled_at', { ascending: true });
  if (error) return handleError(error, []); return data || [];
}
export async function getInterviewById(id: string): Promise<Interview | null> {
  const { data, error } = await supabase.from('interviews').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getInterviewsByApplication(applicationId: string): Promise<Interview[]> {
  const { data, error } = await supabase.from('interviews').select('*').eq('application_id', applicationId);
  if (error) return handleError(error, []); return data || [];
}
export async function createInterview(data: Partial<Interview>): Promise<Interview | null> {
  const { data: result, error } = await supabase.from('interviews').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateInterview(id: string, data: Partial<Interview>): Promise<Interview | null> {
  const { data: result, error } = await supabase.from('interviews').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteInterview(id: string): Promise<boolean> {
  const { error } = await supabase.from('interviews').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB ALERTS ───
export async function getJobAlerts(userId: string): Promise<JobAlert[]> {
  const { data, error } = await supabase.from('job_alerts').select('*').eq('user_id', userId);
  if (error) return handleError(error, []); return data || [];
}
export async function createJobAlert(data: Partial<JobAlert>): Promise<JobAlert | null> {
  const { data: result, error } = await supabase.from('job_alerts').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateJobAlert(id: string, data: Partial<JobAlert>): Promise<JobAlert | null> {
  const { data: result, error } = await supabase.from('job_alerts').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobAlert(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_alerts').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── SAVED JOBS ───
export async function getSavedJobs(userId: string): Promise<SavedJob[]> {
  const { data, error } = await supabase.from('saved_jobs').select('*').eq('user_id', userId);
  if (error) return handleError(error, []); return data || [];
}
export async function saveJob(data: Partial<SavedJob>): Promise<SavedJob | null> {
  const { data: result, error } = await supabase.from('saved_jobs').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function unsaveJob(id: string): Promise<boolean> {
  const { error } = await supabase.from('saved_jobs').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB CATEGORIES ───
export async function getJobCategories(): Promise<JobCategory[]> {
  const { data, error } = await supabase.from('job_categories').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getJobCategoryById(id: string): Promise<JobCategory | null> {
  const { data, error } = await supabase.from('job_categories').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createJobCategory(data: Partial<JobCategory>): Promise<JobCategory | null> {
  const { data: result, error } = await supabase.from('job_categories').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateJobCategory(id: string, data: Partial<JobCategory>): Promise<JobCategory | null> {
  const { data: result, error } = await supabase.from('job_categories').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_categories').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB REVIEWS ───
export async function getJobReviews(): Promise<JobReview[]> {
  const { data, error } = await supabase.from('job_reviews').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createJobReview(data: Partial<JobReview>): Promise<JobReview | null> {
  const { data: result, error } = await supabase.from('job_reviews').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateJobReview(id: string, data: Partial<JobReview>): Promise<JobReview | null> {
  const { data: result, error } = await supabase.from('job_reviews').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobReview(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_reviews').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── CONTRACTS ───
export async function getContracts(): Promise<Contract[]> {
  const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getContractById(id: string): Promise<Contract | null> {
  const { data, error } = await supabase.from('contracts').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getContractsByEmployee(employeeId: string): Promise<Contract[]> {
  const { data, error } = await supabase.from('contracts').select('*').eq('employee_id', employeeId);
  if (error) return handleError(error, []); return data || [];
}
export async function getContractsByEmployer(employerId: string): Promise<Contract[]> {
  const { data, error } = await supabase.from('contracts').select('*').eq('employer_id', employerId);
  if (error) return handleError(error, []); return data || [];
}
export async function createContract(data: Partial<Contract>): Promise<Contract | null> {
  const { data: result, error } = await supabase.from('contracts').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateContract(id: string, data: Partial<Contract>): Promise<Contract | null> {
  const { data: result, error } = await supabase.from('contracts').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteContract(id: string): Promise<boolean> {
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TIMESHEETS ───
export async function getTimesheets(contractId: string): Promise<Timesheet[]> {
  const { data, error } = await supabase.from('timesheets').select('*').eq('contract_id', contractId).order('date', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createTimesheet(data: Partial<Timesheet>): Promise<Timesheet | null> {
  const { data: result, error } = await supabase.from('timesheets').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateTimesheet(id: string, data: Partial<Timesheet>): Promise<Timesheet | null> {
  const { data: result, error } = await supabase.from('timesheets').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteTimesheet(id: string): Promise<boolean> {
  const { error } = await supabase.from('timesheets').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── PAYROLL ───
export async function getPayrolls(contractId: string): Promise<Payroll[]> {
  const { data, error } = await supabase.from('payrolls').select('*').eq('contract_id', contractId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createPayroll(data: Partial<Payroll>): Promise<Payroll | null> {
  const { data: result, error } = await supabase.from('payrolls').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updatePayroll(id: string, data: Partial<Payroll>): Promise<Payroll | null> {
  const { data: result, error } = await supabase.from('payrolls').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deletePayroll(id: string): Promise<boolean> {
  const { error } = await supabase.from('payrolls').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB MESSAGES ───
export async function getJobMessages(userId: string): Promise<JobMessage[]> {
  const { data, error } = await supabase.from('job_messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createJobMessage(data: Partial<JobMessage>): Promise<JobMessage | null> {
  const { data: result, error } = await supabase.from('job_messages').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobMessage(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_messages').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB REFERRALS ───
export async function getJobReferrals(userId: string): Promise<JobReferral[]> {
  const { data, error } = await supabase.from('job_referrals').select('*').or(`referrer_id.eq.${userId},referee_id.eq.${userId}`);
  if (error) return handleError(error, []); return data || [];
}
export async function createJobReferral(data: Partial<JobReferral>): Promise<JobReferral | null> {
  const { data: result, error } = await supabase.from('job_referrals').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateJobReferral(id: string, data: Partial<JobReferral>): Promise<JobReferral | null> {
  const { data: result, error } = await supabase.from('job_referrals').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobReferral(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_referrals').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB REPORTS ───
export async function getJobReports(): Promise<JobReport[]> {
  const { data, error } = await supabase.from('job_reports').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function createJobReport(data: Partial<JobReport>): Promise<JobReport | null> {
  const { data: result, error } = await supabase.from('job_reports').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateJobReport(id: string, data: Partial<JobReport>): Promise<JobReport | null> {
  const { data: result, error } = await supabase.from('job_reports').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobReport(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_reports').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB ANALYTICS ───
export async function getJobAnalytics(jobId: string): Promise<JobAnalytics[]> {
  const { data, error } = await supabase.from('job_analytics').select('*').eq('job_id', jobId).order('date', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createJobAnalytics(data: Partial<JobAnalytics>): Promise<JobAnalytics | null> {
  const { data: result, error } = await supabase.from('job_analytics').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}

// ─── COMPANY REVIEWS ───
export async function getCompanyReviews(companyId: string): Promise<CompanyReview[]> {
  const { data, error } = await supabase.from('company_reviews').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createCompanyReview(data: Partial<CompanyReview>): Promise<CompanyReview | null> {
  const { data: result, error } = await supabase.from('company_reviews').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateCompanyReview(id: string, data: Partial<CompanyReview>): Promise<CompanyReview | null> {
  const { data: result, error } = await supabase.from('company_reviews').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteCompanyReview(id: string): Promise<boolean> {
  const { error } = await supabase.from('company_reviews').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB BENEFITS ───
export async function getJobBenefits(jobId: string): Promise<JobBenefit[]> {
  const { data, error } = await supabase.from('job_benefits').select('*').eq('job_id', jobId);
  if (error) return handleError(error, []); return data || [];
}
export async function createJobBenefit(data: Partial<JobBenefit>): Promise<JobBenefit | null> {
  const { data: result, error } = await supabase.from('job_benefits').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobBenefit(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_benefits').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB REQUIREMENTS ───
export async function getJobRequirements(jobId: string): Promise<JobRequirement[]> {
  const { data, error } = await supabase.from('job_requirements').select('*').eq('job_id', jobId);
  if (error) return handleError(error, []); return data || [];
}
export async function createJobRequirement(data: Partial<JobRequirement>): Promise<JobRequirement | null> {
  const { data: result, error } = await supabase.from('job_requirements').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobRequirement(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_requirements').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB QUESTIONS ───
export async function getJobQuestions(jobId: string): Promise<JobQuestion[]> {
  const { data, error } = await supabase.from('job_questions').select('*').eq('job_id', jobId);
  if (error) return handleError(error, []); return data || [];
}
export async function createJobQuestion(data: Partial<JobQuestion>): Promise<JobQuestion | null> {
  const { data: result, error } = await supabase.from('job_questions').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobQuestion(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_questions').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB ANSWERS ───
export async function getJobAnswers(questionId: string): Promise<JobAnswer[]> {
  const { data, error } = await supabase.from('job_answers').select('*').eq('question_id', questionId);
  if (error) return handleError(error, []); return data || [];
}
export async function createJobAnswer(data: Partial<JobAnswer>): Promise<JobAnswer | null> {
  const { data: result, error } = await supabase.from('job_answers').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}

// ─── JOB OFFERS ───
export async function getJobOffers(): Promise<JobOffer[]> {
  const { data, error } = await supabase.from('job_offers').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getJobOfferById(id: string): Promise<JobOffer | null> {
  const { data, error } = await supabase.from('job_offers').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createJobOffer(data: Partial<JobOffer>): Promise<JobOffer | null> {
  const { data: result, error } = await supabase.from('job_offers').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateJobOffer(id: string, data: Partial<JobOffer>): Promise<JobOffer | null> {
  const { data: result, error } = await supabase.from('job_offers').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobOffer(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_offers').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB BOOKMARKS ───
export async function getJobBookmarks(userId: string): Promise<JobBookmark[]> {
  const { data, error } = await supabase.from('job_bookmarks').select('*').eq('user_id', userId);
  if (error) return handleError(error, []); return data || [];
}
export async function createJobBookmark(data: Partial<JobBookmark>): Promise<JobBookmark | null> {
  const { data: result, error } = await supabase.from('job_bookmarks').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobBookmark(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_bookmarks').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB SEARCHES ───
export async function getJobSearches(userId: string): Promise<JobSearch[]> {
  const { data, error } = await supabase.from('job_searches').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createJobSearch(data: Partial<JobSearch>): Promise<JobSearch | null> {
  const { data: result, error } = await supabase.from('job_searches').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobSearch(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_searches').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB NOTIFICATIONS ───
export async function getJobNotifications(userId: string): Promise<JobNotification[]> {
  const { data, error } = await supabase.from('job_notifications').select('*').eq('user_id', userId).eq('status', 'unread').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createJobNotification(data: Partial<JobNotification>): Promise<JobNotification | null> {
  const { data: result, error } = await supabase.from('job_notifications').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateJobNotification(id: string, data: Partial<JobNotification>): Promise<JobNotification | null> {
  const { data: result, error } = await supabase.from('job_notifications').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobNotification(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_notifications').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── JOB SKILL MATCHES ───
export async function getJobSkillMatches(jobId: string): Promise<JobSkillMatch[]> {
  const { data, error } = await supabase.from('job_skill_matches').select('*').eq('job_id', jobId);
  if (error) return handleError(error, []); return data || [];
}
export async function createJobSkillMatch(data: Partial<JobSkillMatch>): Promise<JobSkillMatch | null> {
  const { data: result, error } = await supabase.from('job_skill_matches').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteJobSkillMatch(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_skill_matches').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── STATS ───
export async function getJobsStats(): Promise<any> {
  const { count: jobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
  const { count: applications } = await supabase.from('job_applications').select('*', { count: 'exact', head: true });
  const { count: profiles } = await supabase.from('work_profiles').select('*', { count: 'exact', head: true });
  const { count: employers } = await supabase.from('employer_profiles').select('*', { count: 'exact', head: true });
  return { jobs, applications, profiles, employers };
}
