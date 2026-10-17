// @ts-nocheck
/**
 * ASIS CSE — Central Tool Registry & Execution Gateway
 * Enforces schema validation, risk classification, permission checks, and audit logging.
 */

import { 
  CognitiveTool, 
  ToolExecutionRequest, 
  ToolExecutionResult, 
  RiskLevel, 
  ExecutionStatus 
} from './asis-cse-tool-types';
import { CognitiveEventBus, CognitiveEventType, EventPriority } from './asis-cse-event-system';

class ToolRegistry {
  private tools: Map<string, CognitiveTool> = new Map();
  private riskPolicies: Map<string, RiskLevel> = new Map();

  /**
   * Register a tool and its default risk policies per capability
   */
  registerTool(tool: CognitiveTool) {
    this.tools.set(tool.name, tool);
    
    // Map default risk levels for each capability
    for (const cap of tool.capabilities) {
      const policyKey = `${tool.name}:${cap.name}`;
      this.riskPolicies.set(policyKey, cap.defaultRiskLevel || 'MONITOR');
    }
    
    console.log(`[ToolRegistry] Registered tool: ${tool.name} v${tool.version}`);
  }

  /**
   * Centralized execution gateway. NO tool should be called directly.
   */
  async executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const tool = this.tools.get(request.toolName);

    // 1. Tool Existence Check
    if (!tool) {
      return this.createResult(request, 'failed', undefined, `Tool '${request.toolName}' not found`, startTime, 'BLOCK');
    }

    // 2. Availability Check
    const isAvailable = await tool.isAvailable();
    if (!isAvailable) {
      await this.logAudit(request, 'unavailable', 'Tool is currently unavailable', startTime);
      return this.createResult(request, 'unavailable', undefined, 'Tool is currently unavailable', startTime, 'MONITOR');
    }

    // 3. Risk Assessment & Blocking
    const riskLevel = this.assessRisk(request.toolName, request.capability, request.parameters);
    if (riskLevel === 'BLOCK') {
      await this.logAudit(request, 'denied', 'Action blocked by security policy', startTime);
      return this.createResult(request, 'denied', undefined, 'Action blocked by central security policy', startTime, 'BLOCK');
    }

    // 4. Approval Enforcement
    const requiresApproval = this.requiresApproval(request.toolName, request.capability);
    if (requiresApproval && riskLevel === 'ASK' && !request.approvalToken) {
      await this.logAudit(request, 'approval_required', 'Waiting for user approval', startTime);
      return this.createResult(request, 'approval_required', undefined, 'Explicit user approval required for this action', startTime, 'ASK');
    }

    // 5. Execution
    try {
      // Enforce timeout if specified
      let executionPromise = tool.execute(request);
      if (request.timeoutMs) {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Execution timed out')), request.timeoutMs)
        );
        executionPromise = Promise.race([executionPromise, timeoutPromise]) as any;
      }

      const rawResult = await executionPromise;
      const finalStatus: ExecutionStatus = rawResult.error ? 'failed' : 'succeeded';
      
      await this.logAudit(request, finalStatus, rawResult.error, startTime, rawResult.data);
      
      return {
        ...rawResult,
        status: finalStatus,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          correlationId: request.correlationId,
          timestamp: Date.now(),
          riskLevel,
          auditLogged: true,
        }
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown execution error';
      const status: ExecutionStatus = errorMsg.includes('timed out') ? 'timed_out' : 'failed';
      
      await this.logAudit(request, status, errorMsg, startTime);
      return this.createResult(request, status, undefined, errorMsg, startTime, riskLevel);
    }
  }

  /**
   * Dynamic risk assessment. Can be extended with a dedicated policy engine.
   */
  private assessRisk(toolName: string, capability: string, parameters: any): RiskLevel {
    const policyKey = `${toolName}:${capability}`;
    const defaultRisk = this.riskPolicies.get(policyKey) || 'MONITOR';

    // Hardcoded overrides for known dangerous patterns
    if (toolName === 'terminal' && typeof parameters.command === 'string') {
      if (parameters.command.includes('sudo') || parameters.command.includes('rm -rf')) {
        return 'BLOCK';
      }
    }

    return defaultRisk;
  }

  /**
   * Check if the specific capability requires explicit user approval.
   */
  private requiresApproval(toolName: string, capability: string): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) return false;
    
    const perm = tool.permissions.find(p => p.action === capability);
    return perm?.requiresApproval ?? false;
  }

  /**
   * Emit audit event to the central event bus for persistence.
   */
  private async logAudit(request: ToolExecutionRequest, status: string, error?: string, startTime?: number, data?: any) {
    const durationMs = startTime ? Date.now() - startTime : 0;
    
    // Redact sensitive data before logging
    const safeParameters = { ...request.parameters };
    if (safeParameters) {
      Object.keys(safeParameters).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('api_key') || lowerKey.includes('secret')) {
          safeParameters[key] = '[REDACTED]';
        }
      });
    }

    CognitiveEventBus.emit(CognitiveEventType.TOOL_EXECUTION, {
      priority: EventPriority.HIGH,
      payload: {
        correlationId: request.correlationId,
        toolName: request.toolName,
        capability: request.capability,
        status,
        error,
        parameters: safeParameters,
        timestamp: Date.now(),
        durationMs,
      }
    }, request.context?.userId || 'anonymous');
  }

  /**
   * Helper to construct a standardized failure/blocked result.
   */
  private createResult(
    request: ToolExecutionRequest, 
    status: ExecutionStatus, 
    data: any, 
    error: string | undefined, 
    startTime: number, 
    riskLevel: RiskLevel
  ): ToolExecutionResult {
    return {
      status,
      toolName: request.toolName,
      capability: request.capability,
      data,
      error,
      executionTimeMs: Date.now() - startTime,
      metadata: {
        correlationId: request.correlationId,
        timestamp: Date.now(),
        riskLevel,
        auditLogged: true,
      }
    };
  }

  getToolHealth(): Record<string, any> {
    const health: Record<string, any> = {};
    for (const [name, tool] of this.tools.entries()) {
      health[name] = tool.getHealth();
    }
    return health;
  }
}

export const globalToolRegistry = new ToolRegistry();
