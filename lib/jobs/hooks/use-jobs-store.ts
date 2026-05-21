import { create } from "zustand";
import { getJobs, getMyApplications, getWorkProfile, applyForJob } from "@/lib/jobs/services/jobs-service";
import type { Job, JobApplication, WorkProfile } from "@/lib/jobs/types";

interface JobsState {
  jobs: Job[];
  applications: JobApplication[];
  profile: WorkProfile | null;
  loading: boolean;
  refreshJobs: (filter?: any) => Promise<void>;
  refreshApplications: (userId: string) => Promise<void>;
  refreshProfile: (userId: string) => Promise<void>;
  apply: (jobId: string, userId: string, coverLetter?: string) => Promise<void>;
}

export const useJobsStore = create<JobsState>((set) => ({
  jobs: [],
  applications: [],
  profile: null,
  loading: false,
  refreshJobs: async (filter) => {
    set({ loading: true });
    try { const jobs = await getJobs(filter); set({ jobs, loading: false }); }
    catch { set({ loading: false }); }
  },
  refreshApplications: async (userId) => {
    const applications = await getMyApplications(userId);
    set({ applications });
  },
  refreshProfile: async (userId) => {
    const profile = await getWorkProfile(userId);
    set({ profile });
  },
  apply: async (jobId, userId, coverLetter) => {
    await applyForJob(jobId, userId, coverLetter);
    const applications = await getMyApplications(userId);
    set({ applications });
  },
}));
