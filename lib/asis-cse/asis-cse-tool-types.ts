// @ts-nocheck
/**
 * ASIS CSE — Tool Abstraction Layer
 * Unified interface for all cognitive tools
 * Permission model, capability schema, execution contract
 */

import { CognitiveEventBus, CognitiveEventType, EventPriority } from './asis-cse-event-system';
import { MetricsEngine } from './asis-cse-metrics-engine';
import { CognitiveContext } from './asis-cse-context';

export type RiskLevel = 'SAFE' | 'MONITOR' | 'ASK' | 'BLOCK';
export type ExecutionStatus = 'succeeded' | 'denied' | 'approval_required' | 'approval_rejected' | 'approval_unavailable' | 'timed_out' | 'cancelled' | 'unavailable' | 'failed';

export interface ToolCapability {
  name: string;
  description: string;
  parameters: ToolParameter[];
  returns: ToolReturnSchema;
  examples?: string[];
  defaultRiskLevel?: RiskLevel;
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
  riskLevel: RiskLevel;
}

export interface ToolExecutionRequest {
  toolName: string;
  capability: string;
  parameters: Record<string, any>;
  context: CognitiveContext;
  correlationId: string;
  timeoutMs?: number;
  approvalToken?: string; // Required for 'ASK' risk level actions
}

export interface ToolExecutionResult {
  status: ExecutionStatus;
  toolName: string;
  capability: string;
  data?: any;
  error?: string;
  executionTimeMs: number;
  metadata: {
    correlationId: string;
    timestamp: number;
    riskLevel: RiskLevel;
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
  execute(request: ToolExecutionRequest): Promise<Omit<ToolExecutionResult, 'status' | 'executionTimeMs' | 'metadata'>>;
  getHealth(): { healthy: boolean; score: number; lastError?: string };
}
