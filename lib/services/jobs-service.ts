import { supabase } from '@/lib/supabase/client';
import type { FunctionsHttpError } from '@supabase/supabase-js';

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  job_type: string;
  status: string;
  skills: string[] | null;
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string | null;
  resume_url: string | null;
  status: string;
  created_at: string;
}

export interface WorkProfile {
  id: string;
  user_id: string;
  headline: string | null;
  summary: string | null;
  skills: string[] | null;
  experience: any[];
  education: any[];
  resume_url: string | null;
  availability: string;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

async function invokeEdgeFunction<T>(functionName: string, body?: Record<string, any>): Promise<ServiceResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    if (error) {
      const httpError = error as FunctionsHttpError;
      return { data: null, error: httpError.message || `Edge function ${functionName} failed` };
    }
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || `Failed to call ${functionName}` };
  }
}

export async function getJobs(filters?: { job_type?: string; location?: string }): Promise<ServiceResult<Job[]>> {
  return invokeEdgeFunction('jobs-operations', { action: 'get_jobs', ...filters });
}

export async function getJobById(jobId: string): Promise<ServiceResult<Job>> {
  return invokeEdgeFunction('jobs-operations', { action: 'get_job', job_id: jobId });
}

export async function createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResult<Job>> {
  return invokeEdgeFunction('jobs-operations', { action: 'create_job', ...job });
}

export async function getApplications(applicantId: string): Promise<ServiceResult<JobApplication[]>> {
  return invokeEdgeFunction('jobs-operations', { action: 'get_applications', applicant_id: applicantId });
}

export async function getApplicationsForJob(jobId: string): Promise<ServiceResult<JobApplication[]>> {
  return invokeEdgeFunction('jobs-operations', { action: 'get_job_applications', job_id: jobId });
}

export async function applyToJob(jobId: string, applicantId: string, coverLetter?: string, resumeUrl?: string): Promise<ServiceResult<JobApplication>> {
  return invokeEdgeFunction('jobs-operations', { action: 'apply', job_id: jobId, applicant_id: applicantId, cover_letter: coverLetter, resume_url: resumeUrl });
}

export async function getWorkProfile(userId: string): Promise<ServiceResult<WorkProfile>> {
  return invokeEdgeFunction('jobs-operations', { action: 'get_work_profile', user_id: userId });
}

export async function upsertWorkProfile(profile: Partial<WorkProfile> & { user_id: string }): Promise<ServiceResult<WorkProfile>> {
  return invokeEdgeFunction('jobs-operations', { action: 'upsert_work_profile', ...profile });
}
