/**
 * ASIS Layer 4 — Agent Guard
 * Safety controls for multi-agent orchestration
 * Prevents infinite loops, deadlocks, runaway execution
 */

import { ContextScope } from '../types/memory.types';

export interface AgentGuardConfig {
  maxDelegationDepth: number;
  maxParallelAgents: number;
  agentTimeoutMs: number;
  maxRetriesPerAgent: number;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  parentId?: string;
  depth: number;
  startTime: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  result?: unknown;
  error?: string;
}

export class AgentGuard {
  private config: AgentGuardConfig;
  private executions: Map<string, AgentExecution> = new Map();
  private activeCount: number = 0;
  private cancellationTokens: Map<string, AbortController> = new Map();

  constructor(config: Partial<AgentGuardConfig> = {}) {
    this.config = {
      maxDelegationDepth: 5,
      maxParallelAgents: 3,
      agentTimeoutMs: 30000,
      maxRetriesPerAgent: 2,
      ...config,
    };
  }

  /**
   * Register new agent execution
   */
  register(agentId: string, parentId?: string): AgentExecution {
    // Check depth limit
    const depth = parentId ? (this.executions.get(parentId)?.depth || 0) + 1 : 0;
    if (depth > this.config.maxDelegationDepth) {
      throw new AgentGuardError(
        `Max delegation depth (${this.config.maxDelegationDepth}) exceeded`,
        'DEPTH_EXCEEDED'
      );
    }

    // Check parallel limit
    if (this.activeCount >= this.config.maxParallelAgents) {
      throw new AgentGuardError(
        `Max parallel agents (${this.config.maxParallelAgents}) exceeded`,
        'PARALLEL_EXCEEDED'
      );
    }

    const execution: AgentExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      agentId,
      parentId,
      depth,
      startTime: Date.now(),
      status: 'running',
    };

    this.executions.set(execution.id, execution);
    this.activeCount++;

    // Set up timeout
    this.setupTimeout(execution.id);

    return execution;
  }

  /**
   * Complete execution
   */
  complete(executionId: string, result: unknown): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'completed';
    execution.result = result;
    this.activeCount--;

    this.clearTimeout(executionId);
  }

  /**
   * Fail execution
   */
  fail(executionId: string, error: string): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'failed';
    execution.error = error;
    this.activeCount--;

    this.clearTimeout(executionId);
  }

  /**
   * Cancel execution
   */
  cancel(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'cancelled';
    this.activeCount--;

    // Cancel any child executions
    for (const [id, exec] of this.executions) {
      if (exec.parentId === executionId && exec.status === 'running') {
        this.cancel(id);
      }
    }

    // Trigger abort controller
    const controller = this.cancellationTokens.get(executionId);
    if (controller) {
      controller.abort();
    }

    this.clearTimeout(executionId);
  }

  /**
   * Get abort signal for execution
   */
  getAbortSignal(executionId: string): AbortSignal {
    let controller = this.cancellationTokens.get(executionId);
    if (!controller) {
      controller = new AbortController();
      this.cancellationTokens.set(executionId, controller);
    }
    return controller.signal;
  }

  /**
   * Check if execution is active
   */
  isActive(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    return execution?.status === 'running';
  }

  /**
   * Get execution stats
   */
  getStats(): {
    active: number;
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    timedOut: number;
  } {
    const stats = { active: 0, total: 0, completed: 0, failed: 0, cancelled: 0, timedOut: 0 };
    for (const execution of this.executions.values()) {
      stats.total++;
      stats[execution.status]++;
    }
    return stats;
  }

  /**
   * Validate scope access for agent
   */
  validateScopeAccess(agentId: string, requestedScope: ContextScope, allowedScopes: ContextScope[]): boolean {
    const agentScopeMap: Record<string, ContextScope[]> = {
      wallet_agent: [ContextScope.WALLET, ContextScope.GLOBAL],
      health_agent: [ContextScope.HEALTH, ContextScope.GLOBAL],
      mtaxi_agent: [ContextScope.TRANSPORT, ContextScope.GLOBAL],
      mtruck_agent: [ContextScope.TRANSPORT, ContextScope.GLOBAL],
      shop_agent: [ContextScope.SHOP, ContextScope.GLOBAL],
      marketplace_agent: [ContextScope.MARKETPLACE, ContextScope.GLOBAL],
      civic_agent: [ContextScope.CIVIC, ContextScope.GLOBAL],
      education_agent: [ContextScope.EDUCATION, ContextScope.GLOBAL],
      jobs_agent: [ContextScope.JOBS, ContextScope.GLOBAL],
      tribes_agent: [ContextScope.TRIBES, ContextScope.GLOBAL],
      engineering_agent: [ContextScope.ENGINEERING, ContextScope.GLOBAL],
      general_agent: Object.values(ContextScope),
      admin_agent: Object.values(ContextScope),
    };

    const agentScopes = agentScopeMap[agentId] || [ContextScope.GLOBAL];
    const hasAccess = agentScopes.includes(requestedScope) && allowedScopes.includes(requestedScope);

    if (!hasAccess) {
      throw new AgentGuardError(
        `Agent ${agentId} denied access to scope ${requestedScope}`,
        'SCOPE_DENIED'
      );
    }

    return true;
  }

  private setupTimeout(executionId: string): void {
    setTimeout(() => {
      const execution = this.executions.get(executionId);
      if (execution && execution.status === 'running') {
        execution.status = 'timeout';
        this.activeCount--;
        this.clearTimeout(executionId);
      }
    }, this.config.agentTimeoutMs);
  }

  private clearTimeout(executionId: string): void {
    // Timeout is handled by setTimeout, nothing to clear
    this.cancellationTokens.delete(executionId);
  }
}

export class AgentGuardError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AgentGuardError';
    this.code = code;
  }
}
