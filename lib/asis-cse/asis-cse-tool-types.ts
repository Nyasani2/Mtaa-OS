/**
 * ASIS CSE — Tool Abstraction Layer
 * Unified interface for all cognitive tools
 * Permission model, capability schema, execution contract
 */

import { CognitiveEventBus, CognitiveEventType, EventPriority } from './asis-cse-event-system';
import { MetricsEngine } from './asis-cse-metrics-engine';
import { CognitiveContext } from './asis-cse-context';

export interface ToolCapability {
  name: string;
  description: string;
  parameters: ToolParameter[];
  returns: ToolReturnSchema;
  examples?: string[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
}

export interface ToolReturnSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  fields?: Record<string, string>;
}

export interface ToolPermission {
  action: string;
  level: 'none' | 'read' | 'write' | 'admin';
  requiresApproval: boolean;
  auditLog: boolean;
}

export interface ToolExecutionRequest {
  toolName: string;
  capability: string;
  parameters: Record<string, any>;
  context: CognitiveContext;
  correlationId: string;
  timeoutMs?: number;
}

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  capability: string;
  data: any;
  error?: string;
  executionTimeMs: number;
  metadata: {
    correlationId: string;
    timestamp: number;
    permissionLevel: string;
    auditLogged: boolean;
  };
}

export interface CognitiveTool {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly capabilities: ToolCapability[];
  readonly permissions: ToolPermission[];
  readonly requiresNetwork: boolean;
  readonly requiresFilesystem: boolean;
  readonly sandboxed: boolean;

  isAvailable(): boolean | Promise<boolean>;
  execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
  getHealth(): { healthy: boolean; score: number; lastError?: string };
}

export abstract class BaseCognitiveTool implements CognitiveTool {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly version: string;
  abstract readonly capabilities: ToolCapability[];
  abstract readonly permissions: ToolPermission[];
  abstract readonly requiresNetwork: boolean;
  abstract readonly requiresFilesystem: boolean;
  abstract readonly sandboxed: boolean;

  protected eventBus?: CognitiveEventBus;
  protected metricsEngine?: MetricsEngine;
  protected lastError?: string;
  protected executionCount = 0;
  protected errorCount = 0;

  constructor(eventBus?: CognitiveEventBus, metricsEngine?: MetricsEngine) {
    this.eventBus = eventBus;
    this.metricsEngine = metricsEngine;
  }

  abstract isAvailable(): boolean | Promise<boolean>;
  abstract doExecute(request: ToolExecutionRequest): Promise<any>;

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.executionCount++;

    const capability = this.capabilities.find((c) => c.name === request.capability);
    if (!capability) {
      const error = `Capability '${request.capability}' not found on tool '${this.name}'`;
      this.lastError = error;
      this.errorCount++;
      return this.buildResult(request, false, null, error, startTime);
    }

    for (const param of capability.parameters) {
      if (param.required && !(param.name in request.parameters)) {
        const error = `Missing required parameter '${param.name}' for capability '${request.capability}'`;
        this.lastError = error;
        this.errorCount++;
        return this.buildResult(request, false, null, error, startTime);
      }
    }

    const permission = this.permissions.find((p) => p.action === request.capability);
    const permissionLevel = permission?.level || 'none';

    try {
      const data = await this.doExecute(request);
      return this.buildResult(request, true, data, undefined, startTime, permissionLevel);
    } catch (err: any) {
      const error = err?.message || String(err);
      this.lastError = error;
      this.errorCount++;
      return this.buildResult(request, false, null, error, startTime, permissionLevel);
    }
  }

  private buildResult(
    request: ToolExecutionRequest,
    success: boolean,
    data: any,
    error: string | undefined,
    startTime: number,
    permissionLevel = 'none'
  ): ToolExecutionResult {
    const executionTimeMs = Date.now() - startTime;

    const result: ToolExecutionResult = {
      success,
      toolName: this.name,
      capability: request.capability,
      data,
      error,
      executionTimeMs,
      metadata: {
        correlationId: request.correlationId,
        timestamp: Date.now(),
        permissionLevel,
        auditLogged: this.permissions.some((p) => p.action === request.capability && p.auditLog),
      },
    };

    if (this.eventBus) {
      this.eventBus.publish({
        type: success ? CognitiveEventType.ACTION_EXECUTED : CognitiveEventType.ENGINE_ERROR,
        payload: {
          tool: this.name,
          capability: request.capability,
          success,
          executionTimeMs,
          correlationId: request.correlationId,
        },
        source: `Tool:${this.name}`,
        priority: success ? EventPriority.NORMAL : EventPriority.HIGH,
        correlationId: request.correlationId,
      });
    }

    if (this.metricsEngine) {
      this.metricsEngine.recordEngineExecution(
        `tool_${this.name}`,
        { type: 'tool', data: request },
        {
          success,
          output: data,
          explanation: error || `${this.name}.${request.capability} executed`,
          confidence: { overall: success ? 0.9 : 0.1, source: 'tool_execution' },
          metadata: { executionTimeMs },
        },
        executionTimeMs
      );
    }

    return result;
  }

  getHealth(): { healthy: boolean; score: number; lastError?: string } {
    const score = this.executionCount === 0 ? 1.0 : 1.0 - this.errorCount / this.executionCount;
    return {
      healthy: score > 0.7 && !this.lastError,
      score,
      lastError: this.lastError,
    };
  }

  getCapability(name: string): ToolCapability | undefined {
    return this.capabilities.find((c) => c.name === name);
  }

  hasCapability(name: string): boolean {
    return this.capabilities.some((c) => c.name === name);
  }
}
