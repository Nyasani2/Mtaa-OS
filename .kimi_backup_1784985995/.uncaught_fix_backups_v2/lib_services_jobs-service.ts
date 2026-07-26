/**
 * MTAA OS V10 — Jobs Service
 * Tables: jobs_listings, job_applications, job_categories, job_skills, employer_profiles
 */
import { supabase } from '@/lib/supabase/client';

export interface JobListing {
  id: string;
  employer_id: string;
  category_id: string | null;
  title: string;
  description: string;
  requirements: string[] | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote';
  status: 'active' | 'closed' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  listing_id: string;
  applicant_id: string;
  cover_letter: string | null;
  resume_url: string | null;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  created_at: string;
  updated_at: string;
}

// ── LISTINGS ──────────────────────────────────────────────

export async function fetchJobListings(options: {
  categoryId?: string;
  type?: string;
  location?: string;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { categoryId, type, location, search, status = 'active', limit = 20, offset = 0 } = options;
  let q = supabase.from('jobs_listings').select('*');

  if (categoryId) q = q.eq('category_id', categoryId);
  if (type) q = q.eq('type', type);
  if (location) q = q.ilike('location', `%${location}%`);
  if (status) q = q.eq('status', status);
  if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as JobListing[];
}

export async function fetchJobListingById(id: string) {
  const { data, error } = await supabase.from('jobs_listings').select('*').eq('id', id).single();
  if (error) throw error;
  return data as JobListing;
}

export async function createJobListing(payload: Partial<JobListing>) {
  const { data, error } = await supabase.from('jobs_listings').insert(payload).select().single();
  if (error) throw error;
  return data as JobListing;
}

export async function updateJobListing(id: string, payload: Partial<JobListing>) {
  const { data, error } = await supabase.from('jobs_listings').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as JobListing;
}

export async function deleteJobListing(id: string) {
  const { error } = await supabase.from('jobs_listings').delete().eq('id', id);
  if (error) throw error;
}

// ── APPLICATIONS ──────────────────────────────────────────

export async function fetchJobApplications(options: {
  listingId?: string;
  applicantId?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { listingId, applicantId, status, limit = 20, offset = 0 } = options;
  let q = supabase.from('job_applications').select('*');

  if (listingId) q = q.eq('listing_id', listingId);
  if (applicantId) q = q.eq('applicant_id', applicantId);
  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as JobApplication[];
}

export async function createJobApplication(payload: Partial<JobApplication>) {
  const { data, error } = await supabase.from('job_applications').insert(payload).select().single();
  if (error) throw error;
  return data as JobApplication;
}

export async function updateJobApplicationStatus(id: string, status: JobApplication['status']) {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as JobApplication;
}

// ── CATEGORIES ────────────────────────────────────────────

export async function fetchJobCategories() {
  const { data, error } = await supabase.from('job_categories').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

// ── EMPLOYER ──────────────────────────────────────────────

export async function fetchEmployerProfile(userId: string) {
  const { data, error } = await supabase.from('employer_profiles').select('*').eq('user_id', userId).single();
  if (error) return null;
  return data;
}

export async function upsertEmployerProfile(payload: any) {
  const { data, error } = await supabase.from('employer_profiles').upsert(payload).select().single();
  if (error) throw error;
  return data;
}
