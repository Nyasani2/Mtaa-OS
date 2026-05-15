/**
 * MTAA AFRIQ — Scheduler Engine (Kernel Layer)
 * Cron jobs, recurring tasks, delayed execution, background processing
 * Phase: P0 Foundation
 * NO FIREBASE — Supabase + Edge Functions + pg_cron
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

// ─── Types ─────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying';
export type JobPriority = 'critical' | 'high' | 'normal' | 'low';

export interface ScheduledJob {
  id: string;
  name: string;
  description?: string;
  status: JobStatus;
  priority: JobPriority;
  cron_expression?: string;           // e.g. "0 0 * * *" for daily
  scheduled_at: string;
  execute_at?: string;                // One-time delayed job
  last_run_at?: string;
  next_run_at?: string;
  max_retries: number;
  retry_count: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  payload: Record<string, unknown>;
  handler: string;                    // Edge function name or RPC function
  user_id?: string;                   // Optional: user-scoped job
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  error_message?: string;
  error_stack?: string;
}

export interface JobResult {
  job_id: string;
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  duration_ms: number;
  executed_at: string;
}

export interface JobQueue {
  id: string;
  name: string;
  description?: string;
  max_concurrent: number;
  current_running: number;
  total_processed: number;
  total_failed: number;
  enabled: boolean;
  created_at: string;
}

export interface JobLog {
  id: string;
  job_id: string;
  status: JobStatus;
  output?: Record<string, unknown>;
  error?: string;
  duration_ms?: number;
  executed_at: string;
  created_at: string;
}

// ─── Constants ─────────────────────────────────────────────────────

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 60;      // seconds
const DEFAULT_TIMEOUT = 300;         // seconds
const MAX_QUEUE_SIZE = 1000;

const BUILT_IN_HANDLERS: Record<string, string> = {
  'process_notification_queue': 'notification-queue-processor',
  'cleanup_old_notifications': 'notification-cleanup',
  'escrow_auto_release': 'escrow-release',
  'billing_cycle': 'billing-processor',
  'generate_reports': 'report-generator',
  'sync_wallets': 'wallet-sync',
  'audit_log_cleanup': 'audit-cleanup',
  'kyc_reminder': 'kyc-reminder',
  'contract_expiry_check': 'contract-expiry',
  'subscription_renewal': 'subscription-renewal',
};

// ─── Scheduler Engine Class ─────────────────────────────────────

export class SchedulerEngine extends EventEmitter {
  private supabase: SupabaseClient;
  private isRunning: boolean = false;
  private pollIntervalMs: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(supabaseUrl: string, supabaseKey: string, pollIntervalMs: number = 5000) {
    super();
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    this.pollIntervalMs = pollIntervalMs;
  }

  // ─── Core Schedule Flow ──────────────────────────────────────────

  /**
   * Schedule a one-time delayed job
   */
  async scheduleOnce(
    name: string,
    handler: string,
    executeAt: Date,
    payload: Record<string, unknown> = {},
    options: Partial<Omit<ScheduledJob, 'id' | 'name' | 'handler' | 'execute_at' | 'payload'>> = {}
  ): Promise<string> {
    const jobId = this.generateId();
    const now = new Date().toISOString();

    const job: ScheduledJob = {
      id: jobId,
      name,
      description: options.description,
      status: 'pending',
      priority: options.priority || 'normal',
      scheduled_at: now,
      execute_at: executeAt.toISOString(),
      max_retries: options.max_retries ?? DEFAULT_MAX_RETRIES,
      retry_count: 0,
      retry_delay_seconds: options.retry_delay_seconds ?? DEFAULT_RETRY_DELAY,
      timeout_seconds: options.timeout_seconds ?? DEFAULT_TIMEOUT,
      payload,
      handler,
      user_id: options.user_id,
      metadata: options.metadata,
      created_at: now,
      updated_at: now,
    };

    const { error } = await this.supabase.from('scheduled_jobs').insert(job);
    if (error) throw error;

    this.emit('scheduled', { jobId, name, executeAt });
    return jobId;
  }

  /**
   * Schedule a recurring cron job
   */
  async scheduleRecurring(
    name: string,
    handler: string,
    cronExpression: string,
    payload: Record<string, unknown> = {},
    options: Partial<Omit<ScheduledJob, 'id' | 'name' | 'handler' | 'cron_expression' | 'payload'>> = {}
  ): Promise<string> {
    const jobId = this.generateId();
    const now = new Date().toISOString();
    const nextRun = this.getNextCronRun(cronExpression);

    const job: ScheduledJob = {
      id: jobId,
      name,
      description: options.description,
      status: 'pending',
      priority: options.priority || 'normal',
      cron_expression: cronExpression,
      scheduled_at: now,
      next_run_at: nextRun,
      max_retries: options.max_retries ?? DEFAULT_MAX_RETRIES,
      retry_count: 0,
      retry_delay_seconds: options.retry_delay_seconds ?? DEFAULT_RETRY_DELAY,
      timeout_seconds: options.timeout_seconds ?? DEFAULT_TIMEOUT,
      payload,
      handler,
      user_id: options.user_id,
      metadata: options.metadata,
      created_at: now,
      updated_at: now,
    };

    const { error } = await this.supabase.from('scheduled_jobs').insert(job);
    if (error) throw error;

    this.emit('scheduled_recurring', { jobId, name, cronExpression, nextRun });
    return jobId;
  }

  // ─── Job Execution ──────────────────────────────────────────────

  /**
   * Start the scheduler loop (polls for pending jobs)
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.emit('started');
    console.log('[Scheduler] Engine started');

    this.poll(); // Immediate first poll
    this.timer = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  /**
   * Stop the scheduler loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('stopped');
    console.log('[Scheduler] Engine stopped');
  }

  /**
   * Poll for pending jobs and execute
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const now = new Date().toISOString();

      // Fetch pending jobs that are due
      const { data: jobs, error } = await this.supabase
        .from('scheduled_jobs')
        .select('*')
        .in('status', ['pending', 'retrying'])
        .or(`execute_at.lte.${now},next_run_at.lte.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        this.emit('poll_error', error);
        return;
      }

      if (!jobs || jobs.length === 0) return;

      for (const job of jobs) {
        await this.executeJob(job);
      }
    } catch (err) {
      this.emit('poll_error', err);
    }
  }

  /**
   * Execute a single job
   */
  private async executeJob(job: ScheduledJob): Promise<JobResult> {
    const startTime = Date.now();
    const now = new Date().toISOString();

    // Mark as running
    await this.supabase
      .from('scheduled_jobs')
      .update({ status: 'running', updated_at: now, last_run_at: now })
      .eq('id', job.id);

    this.emit('job_started', { jobId: job.id, name: job.name });

    try {
      // Execute via edge function or RPC
      const result = await this.runHandler(job);
      const duration = Date.now() - startTime;

      // Handle recurring: schedule next run
      if (job.cron_expression) {
        const nextRun = this.getNextCronRun(job.cron_expression);
        await this.supabase
          .from('scheduled_jobs')
          .update({
            status: 'pending',
            next_run_at: nextRun,
            updated_at: new Date().toISOString(),
            retry_count: 0,
          })
          .eq('id', job.id);
      } else {
        // One-time job: mark complete
        await this.supabase
          .from('scheduled_jobs')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      }

      // Log success
      const jobResult: JobResult = {
        job_id: job.id,
        success: true,
        output: result,
        duration_ms: duration,
        executed_at: now,
      };

      await this.logJobResult(jobResult);
      this.emit('job_completed', jobResult);

      return jobResult;

    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;

      // Retry logic
      const shouldRetry = job.retry_count < job.max_retries;

      if (shouldRetry) {
        const retryAt = new Date(Date.now() + job.retry_delay_seconds * 1000).toISOString();
        await this.supabase
          .from('scheduled_jobs')
          .update({
            status: 'retrying',
            retry_count: job.retry_count + 1,
            execute_at: retryAt,
            updated_at: new Date().toISOString(),
            error_message: errorMessage,
            error_stack: errorStack,
          })
          .eq('id', job.id);

        this.emit('job_retrying', { jobId: job.id, retryCount: job.retry_count + 1, retryAt });
      } else {
        await this.supabase
          .from('scheduled_jobs')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
            error_message: errorMessage,
            error_stack: errorStack,
          })
          .eq('id', job.id);

        this.emit('job_failed', { jobId: job.id, error: errorMessage });
      }

      const jobResult: JobResult = {
        job_id: job.id,
        success: false,
        error: errorMessage,
        duration_ms: duration,
        executed_at: now,
      };

      await this.logJobResult(jobResult);
      return jobResult;
    }
  }

  /**
   * Run the job handler (edge function or direct RPC)
   */
  private async runHandler(job: ScheduledJob): Promise<Record<string, unknown>> {
    const edgeFunctionName = BUILT_IN_HANDLERS[job.handler] || job.handler;

    // Try edge function first
    try {
      const { data, error } = await this.supabase.functions.invoke(edgeFunctionName, {
        body: {
          job_id: job.id,
          job_name: job.name,
          payload: job.payload,
          user_id: job.user_id,
          retry_count: job.retry_count,
        },
      });

      if (error) throw error;
      return data || {};
    } catch (edgeErr) {
      // Fallback: try RPC function
      const { data, error } = await this.supabase.rpc(job.handler, {
        p_job_id: job.id,
        p_payload: job.payload,
      });

      if (error) throw new Error(`Edge function and RPC both failed: ${edgeErr.message} | ${error.message}`);
      return data || {};
    }
  }

  // ─── Job Management ────────────────────────────────────────────

  async cancelJob(jobId: string): Promise<void> {
    await this.supabase
      .from('scheduled_jobs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    this.emit('job_cancelled', { jobId });
  }

  async rescheduleJob(jobId: string, newExecuteAt: Date): Promise<void> {
    await this.supabase
      .from('scheduled_jobs')
      .update({
        execute_at: newExecuteAt.toISOString(),
        status: 'pending',
        retry_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    this.emit('job_rescheduled', { jobId, newExecuteAt });
  }

  async deleteJob(jobId: string): Promise<void> {
    await this.supabase.from('scheduled_jobs').delete().eq('id', jobId);
    this.emit('job_deleted', { jobId });
  }

  async getJob(jobId: string): Promise<ScheduledJob | null> {
    const { data } = await this.supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    return data;
  }

  async getJobs(filter?: { status?: JobStatus; user_id?: string; handler?: string }): Promise<ScheduledJob[]> {
    let query = this.supabase.from('scheduled_jobs').select('*');
    if (filter?.status) query = query.eq('status', filter.status);
    if (filter?.user_id) query = query.eq('user_id', filter.user_id);
    if (filter?.handler) query = query.eq('handler', filter.handler);
    const { data } = await query.order('created_at', { ascending: false });
    return data || [];
  }

  // ─── Queue Management ──────────────────────────────────────────

  async getQueueStats(queueName: string = 'default'): Promise<JobQueue | null> {
    const { data } = await this.supabase
      .from('job_queues')
      .select('*')
      .eq('name', queueName)
      .single();
    return data;
  }

  async createQueue(name: string, maxConcurrent: number = 5, description?: string): Promise<void> {
    await this.supabase.from('job_queues').insert({
      id: this.generateId(),
      name,
      description,
      max_concurrent: maxConcurrent,
      current_running: 0,
      total_processed: 0,
      total_failed: 0,
      enabled: true,
      created_at: new Date().toISOString(),
    });
  }

  // ─── Job Logs ──────────────────────────────────────────────────

  private async logJobResult(result: JobResult): Promise<void> {
    await this.supabase.from('job_logs').insert({
      id: this.generateId(),
      job_id: result.job_id,
      status: result.success ? 'completed' : 'failed',
      output: result.output,
      error: result.error,
      duration_ms: result.duration_ms,
      executed_at: result.executed_at,
      created_at: new Date().toISOString(),
    });
  }

  async getJobLogs(jobId: string, limit: number = 50): Promise<JobLog[]> {
    const { data } = await this.supabase
      .from('job_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }

  // ─── Built-in Job Schedulers ─────────────────────────────────────

  async setupDefaultJobs(): Promise<void> {
    const now = new Date();

    // Notification queue processor — every 5 minutes
    await this.scheduleRecurring(
      'Process Notification Queue',
      'process_notification_queue',
      '*/5 * * * *',
      {},
      { description: 'Process queued notifications (quiet hours, offline)', priority: 'high' }
    );

    // Cleanup old notifications — daily at 3 AM
    await this.scheduleRecurring(
      'Cleanup Old Notifications',
      'cleanup_old_notifications',
      '0 3 * * *',
      { days_to_keep: 30 },
      { description: 'Delete old read/dismissed notifications', priority: 'low' }
    );

    // Escrow auto-release check — every hour
    await this.scheduleRecurring(
      'Escrow Auto-Release Check',
      'escrow_auto_release',
      '0 * * * *',
      {},
      { description: 'Auto-release escrow funds after milestone approval', priority: 'high' }
    );

    // Billing cycle — daily at midnight
    await this.scheduleRecurring(
      'Billing Cycle Processor',
      'billing_cycle',
      '0 0 * * *',
      {},
      { description: 'Process daily billing, subscriptions, fees', priority: 'high' }
    );

    // Audit log cleanup — weekly Sunday 2 AM
    await this.scheduleRecurring(
      'Audit Log Cleanup',
      'audit_log_cleanup',
      '0 2 * * 0',
      { days_to_keep: 90 },
      { description: 'Archive old audit logs', priority: 'low' }
    );

    // KYC reminder — daily at 9 AM
    await this.scheduleRecurring(
      'KYC Reminder',
      'kyc_reminder',
      '0 9 * * *',
      {},
      { description: 'Send reminders to users with incomplete KYC', priority: 'normal' }
    );

    // Contract expiry check — daily at 6 AM
    await this.scheduleRecurring(
      'Contract Expiry Check',
      'contract_expiry_check',
      '0 6 * * *',
      {},
      { description: 'Notify users of expiring contracts', priority: 'normal' }
    );

    // Wallet sync — every 15 minutes
    await this.scheduleRecurring(
      'Wallet Sync',
      'sync_wallets',
      '*/15 * * * *',
      {},
      { description: 'Sync wallet balances with blockchain', priority: 'high' }
    );

    console.log('[Scheduler] Default jobs scheduled');
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private generateId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNextCronRun(cronExpression: string): string {
    // Simple cron parser — for production, use a proper cron library
    // This is a placeholder that adds 1 hour for basic testing
    const next = new Date(Date.now() + 3600000);
    return next.toISOString();
  }
}

// ─── Singleton Export ────────────────────────────────────────────

let schedulerInstance: SchedulerEngine | null = null;

export function getSchedulerEngine(): SchedulerEngine {
  if (!schedulerInstance) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    schedulerInstance = new SchedulerEngine(supabaseUrl, supabaseKey);
  }
  return schedulerInstance;
}

export { SchedulerEngine };
