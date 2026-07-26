/**
 * ASIS CSE — Tool Registry
 * Central registry for all cognitive tools
 * Discovery, routing, health monitoring, permission enforcement
 */

import { CognitiveTool, ToolExecutionRequest, ToolExecutionResult, BaseCognitiveTool } from './asis-cse-tool-types';
import { CognitiveEventBus, CognitiveEventType, EventPriority } from './asis-cse-event-system';
import { MetricsEngine } from './asis-cse-metrics-engine';
import { CognitiveContext } from './asis-cse-context';

export interface ToolRegistryConfig {
  autoRegisterDefaults: boolean;
  healthCheckIntervalMs: number;
  maxConcurrentExecutions: number;
  defaultTimeoutMs: number;
}

export interface ToolHealthReport {
  toolName: string;
  available: boolean;
  healthy: boolean;
  score: number;
  lastError?: string;
  capabilities: string[];
  executionCount: number;
  errorCount: number;
}

export class ToolRegistry {
  private tools: Map<string, CognitiveTool> = new Map();
  private eventBus?: CognitiveEventBus;
  private metricsEngine?: MetricsEngine;
  private config: ToolRegistryConfig;
  private activeExecutions = 0;
  private healthCheckTimer?: any;

  constructor(
    config: Partial<ToolRegistryConfig> = {},
    eventBus?: CognitiveEventBus,
    metricsEngine?: MetricsEngine
  ) {
    this.config = {
      autoRegisterDefaults: true,
      healthCheckIntervalMs: 30000,
      maxConcurrentExecutions: 10,
      defaultTimeoutMs: 30000,
      ...config,
    };
    this.eventBus = eventBus;
    this.metricsEngine = metricsEngine;

    if (this.config.autoRegisterDefaults) {
      this.registerDefaults();
    }

    this.startHealthChecks();
  }

  register(tool: CognitiveTool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] Tool '${tool.name}' already registered. Overwriting.`);
    }
    this.tools.set(tool.name, tool);
    this.emitEvent(CognitiveEventType.KNOWLEDGE_UPDATED, {
      type: 'tool_registered',
      tool: tool.name,
      capabilities: tool.capabilities.map((c) => c.name),
    });
  }

  unregister(toolName: string): boolean {
    const removed = this.tools.delete(toolName);
    if (removed) {
      this.emitEvent(CognitiveEventType.KNOWLEDGE_UPDATED, {
        type: 'tool_unregistered',
        tool: toolName,
      });
    }
    return removed;
  }

  get(toolName: string): CognitiveTool | undefined {
    return this.tools.get(toolName);
  }

  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }

  listCapabilities(): Array<{ tool: string; capability: string; description: string }> {
    const caps: Array<{ tool: string; capability: string; description: string }> = [];
    this.tools.forEach((tool) => {
      tool.capabilities.forEach((cap) => {
        caps.push({ tool: tool.name, capability: cap.name, description: cap.description });
      });
    });
    return caps;
  }

  findToolsForCapability(capabilityName: string): CognitiveTool[] {
    return Array.from(this.tools.values()).filter((t) =>
      t.capabilities.some((c) => c.name === capabilityName)
    );
  }

  async execute(
    toolName: string,
    capability: string,
    parameters: Record<string, any>,
    context: CognitiveContext,
    correlationId?: string
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        toolName,
        capability,
        data: null,
        error: `Tool '${toolName}' not found in registry`,
        executionTimeMs: 0,
        metadata: {
          correlationId: correlationId || `exec_${Date.now()}`,
          timestamp: Date.now(),
          permissionLevel: 'none',
          auditLogged: true,
        },
      };
    }

    if (this.activeExecutions >= this.config.maxConcurrentExecutions) {
      return {
        success: false,
        toolName,
        capability,
        data: null,
        error: `Max concurrent executions (${this.config.maxConcurrentExecutions}) reached`,
        executionTimeMs: 0,
        metadata: {
          correlationId: correlationId || `exec_${Date.now()}`,
          timestamp: Date.now(),
          permissionLevel: 'none',
          auditLogged: true,
        },
      };
    }

    this.activeExecutions++;

    const request: ToolExecutionRequest = {
      toolName,
      capability,
      parameters,
      context,
      correlationId: correlationId || `exec_${Date.now()}`,
      timeoutMs: this.config.defaultTimeoutMs,
    };

    try {
      const result = await tool.execute(request);
      this.activeExecutions = Math.max(0, this.activeExecutions - 1);
      return result;
    } catch (err: any) {
      this.activeExecutions = Math.max(0, this.activeExecutions - 1);
      return {
        success: false,
        toolName,
        capability,
        data: null,
        error: err?.message || String(err),
        executionTimeMs: 0,
        metadata: {
          correlationId: request.correlationId,
          timestamp: Date.now(),
          permissionLevel: 'none',
          auditLogged: true,
        },
      };
    }
  }

  async executeByCapability(
    capability: string,
    parameters: Record<string, any>,
    context: CognitiveContext,
    correlationId?: string
  ): Promise<ToolExecutionResult> {
    const tools = this.findToolsForCapability(capability);
    if (tools.length === 0) {
      return {
        success: false,
        toolName: 'unknown',
        capability,
        data: null,
        error: `No tool found with capability '${capability}'`,
        executionTimeMs: 0,
        metadata: {
          correlationId: correlationId || `exec_${Date.now()}`,
          timestamp: Date.now(),
          permissionLevel: 'none',
          auditLogged: true,
        },
      };
    }

    // Pick the healthiest tool
    const tool = tools.sort((a, b) => b.getHealth().score - a.getHealth().score)[0];
    return this.execute(tool.name, capability, parameters, context, correlationId);
  }

  getHealthReport(): ToolHealthReport[] {
    return Array.from(this.tools.values()).map((tool) => {
      const health = tool.getHealth();
      return {
        toolName: tool.name,
        available: typeof tool.isAvailable === "function" ? tool.isAvailable() : false,
        healthy: health.healthy,
        score: health.score,
        lastError: health.lastError,
        capabilities: tool.capabilities.map((c) => c.name),
        executionCount: (tool as any).executionCount || 0,
        errorCount: (tool as any).errorCount || 0,
      };
    });
  }

  generateHealthReport(): string {
    const reports = this.getHealthReport();
    const lines = [
      '═══════════════════════════════════════',
      '     ASIS CSE — TOOL HEALTH REPORT',
      '═══════════════════════════════════════',
      `Total Tools: ${reports.length}`,
      `Healthy:     ${reports.filter((r) => r.healthy).length}`,
      `Degraded:    ${reports.filter((r) => !r.healthy && r.available).length}`,
      `Unavailable: ${reports.filter((r) => !r.available).length}`,
      '',
    ];

    reports.forEach((r) => {
      const icon = r.healthy ? '✅' : r.available ? '⚠️' : '❌';
      lines.push(
        `${icon} ${r.toolName.padEnd(16)} score=${(r.score * 100).toFixed(0)}% ` +
        `execs=${r.executionCount} errs=${r.errorCount} ` +
        `caps=[${r.capabilities.join(', ')}]`
      );
      if (r.lastError) lines.push(`   Last error: ${r.lastError.slice(0, 80)}`);
    });

    lines.push('═══════════════════════════════════════');
    return lines.join('\n');
  }

  private registerDefaults(): void {
    // Default tools are registered lazily by the system initializer
    // This prevents import cycles — actual tool instances are injected
    console.log('[ToolRegistry] Default registration mode: lazy (tools injected at init)');
  }

  private startHealthChecks(): void {
    if (this.healthCheckTimer) return;
    this.healthCheckTimer = setInterval(() => {
      const unhealthy = this.getHealthReport().filter((r) => !r.healthy);
      if (unhealthy.length > 0) {
        this.emitEvent(CognitiveEventType.DIAGNOSTIC_ALERT, {
          type: 'tool_health_degraded',
          unhealthyTools: unhealthy.map((u) => u.toolName),
          count: unhealthy.length,
        });
      }
    }, this.config.healthCheckIntervalMs);
  }

  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  destroy(): void {
    this.stopHealthChecks();
    this.tools.clear();
  }

  private emitEvent(type: CognitiveEventType, payload: any): void {
    if (this.eventBus) {
      this.eventBus.publish({
        type,
        payload,
        source: 'ToolRegistry',
        priority: EventPriority.NORMAL,
      });
    }
  }
}

// Singleton instance
let globalRegistry: ToolRegistry | null = null;

export function createToolRegistry(
  config?: Partial<ToolRegistryConfig>,
  eventBus?: CognitiveEventBus,
  metricsEngine?: MetricsEngine
): ToolRegistry {
  if (!globalRegistry) {
    globalRegistry = new ToolRegistry(config, eventBus, metricsEngine);
  }
  return globalRegistry;
}

export function getToolRegistry(): ToolRegistry | null {
  return globalRegistry;
}

export function resetToolRegistry(): void {
  globalRegistry?.destroy();
  globalRegistry = null;
}
