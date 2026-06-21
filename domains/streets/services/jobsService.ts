// lib/streets/services/jobsService.ts
// MTAA Streets — Jobs Service (wired to streets_jobs table)

import { supabase } from '@/lib/supabase';
import { StreetJob } from '../types';

const PAGE_SIZE = 20;

export async function fetchJobs(
  filters?: { category?: string; jobType?: string; location?: string; search?: string },
  page: number = 0
): Promise<{ jobs: StreetJob[]; hasMore: boolean }> {
  let query = supabase
    .from('streets_jobs')
    .select(`
      *,
      poster:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.jobType) {
    query = query.eq('job_type', filters.jobType);
  }
  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const jobs: StreetJob[] = (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    company_name: row.company_name,
    location: row.location,
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    currency: row.currency || 'USD',
    job_type: row.job_type,
    category: row.category,
    skills: row.skills || [],
    requirements: row.requirements || [],
    status: row.status,
    application_count: row.application_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    poster: row.poster,
  }));

  return { jobs, hasMore: jobs.length === PAGE_SIZE };
}

export async function createJob(
  userId: string,
  job: Omit<StreetJob, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'application_count' | 'poster'>
): Promise<StreetJob> {
  const { data, error } = await supabase
    .from('streets_jobs')
    .insert({ ...job, user_id: userId, application_count: 0 })
    .select(`
      *,
      poster:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    company_name: data.company_name,
    location: data.location,
    salary_min: data.salary_min,
    salary_max: data.salary_max,
    currency: data.currency || 'USD',
    job_type: data.job_type,
    category: data.category,
    skills: data.skills || [],
    requirements: data.requirements || [],
    status: data.status,
    application_count: data.application_count || 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
    poster: data.poster,
  };
}

export async function applyToJob(jobId: string, applicantId: string, coverLetter?: string, resumeUrl?: string): Promise<void> {
  const { error } = await supabase
    .from('streets_job_applications')
    .insert({
      job_id: jobId,
      applicant_id: applicantId,
      cover_letter: coverLetter || null,
      resume_url: resumeUrl || null,
      status: 'pending',
    });
  if (error) throw error;
}

export async function updateJobStatus(jobId: string, userId: string, status: 'open' | 'closed' | 'filled'): Promise<void> {
  const { error } = await supabase
    .from('streets_jobs')
    .update({ status })
    .eq('id', jobId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteJob(jobId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_jobs')
    .delete()
    .eq('id', jobId)
    .eq('user_id', userId);
  if (error) throw error;
}
