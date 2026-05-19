import { useEffect, useState } from "react";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "retrying";

export type ScheduledJob = {
  id: string;
  name: string;
  handler: string;
  status: JobStatus;
  priority: string;
  created_at: string;
  retry_count: number;
  max_retries: number;
  timeout_seconds: number;
  cron_expression?: string;
  execute_at?: string;
  next_run_at?: string;
  error_message?: string;
};

export function useScheduler() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TEMP SAFE MOCK (prevents crash, replaces backend later)
    setJobs([]);
    setLogs([]);
    setQueues([]);
    setLoading(false);
  }, []);

  return {
    jobs,
    logs,
    queues,
    loading,
    error,

    // mock actions (so UI doesn't crash)
    cancelJob: async (id: string) => {},
    deleteJob: async (id: string) => {},
    runJobNow: async (id: string) => {},
    refresh: async () => {},

    getJobLogs: async (id: string) => {},

    filterByStatus: (status: any) => {},

    pendingCount: 0,
    runningCount: 0,
    failedCount: 0,
    completedToday: 0,
  };
}
