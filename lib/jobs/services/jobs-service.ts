import { supabase } from "@/lib/supabase";
import type { Job, JobApplication, WorkProfile } from "@/lib/jobs/types";

export async function getJobs(filter?: { type?: string; location?: string; skill?: string }): Promise<Job[]> {
  let query = supabase.from("jobs").select("*").eq("status", "open").order("posted_at", { ascending: false });
  if (filter?.type) query = query.eq("type", filter.type);
  if (filter?.location) query = query.ilike("location", `%${filter.location}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getMyApplications(userId: string): Promise<JobApplication[]> {
  const { data, error } = await supabase.from("job_applications").select("*, jobs(*)").eq("user_id", userId).order("applied_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getWorkProfile(userId: string): Promise<WorkProfile | null> {
  const { data, error } = await supabase.from("work_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function applyForJob(jobId: string, userId: string, coverLetter?: string): Promise<void> {
  const { error } = await supabase.from("job_applications").insert({
    job_id: jobId,
    user_id: userId,
    status: "pending",
    cover_letter: coverLetter,
    applied_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function postJob(job: Partial<Job>): Promise<void> {
  const { error } = await supabase.from("jobs").insert({
    ...job,
    posted_at: new Date().toISOString(),
    status: "open",
    applications: 0,
  });
  if (error) throw error;
}
