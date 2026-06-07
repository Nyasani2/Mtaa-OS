/**
 * BaseAgent
 * Abstract base class for all ASIS agents
 * Provides common functionality: initialization, validation, error handling, metrics
 */

import { IASISAgent } from '../shared/interfaces';
import { AgentRequest, AgentResponse } from '../shared/types';
import { AgentState, ToolDefinition, ToolExecution, ToolResult } from './types';
import { ASISEventBus } from '../core/event-bus';
import { ASISSecurityLayer } from '../security/security-layer';
import { generateId } from '../shared/utils';
import { Text } from 'react-native';


export abstract class BaseAgent implements IASISAgent {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly capabilities: string[];

  protected _eventBus: ASISEventBus;
  protected _security: ASISSecurityLayer;
  protected _state: AgentState;
  protected _tools: Map<string, ToolDefinition> = new Map();
  protected _initialized: boolean = false;

  constructor(eventBus: ASISEventBus, security: ASISSecurityLayer) {
    this._eventBus = eventBus;
    this._security = security;
    this._state = {
      name: this.name,
      status: 'idle',
      lastRequest: 0,
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
    };
  }

  async initialize(): Promise<void> {
    this._registerTools();
    this._setupEventListeners();
    this._initialized = true;
    console.log(`[ASIS:${this.name}] Initialized v${this.version}`);
  }

  async shutdown(): Promise<void> {
    this._initialized = false;
    console.log(`[ASIS:${this.name}] Shutdown`);
  }

  abstract process(request: AgentRequest): Promise<AgentResponse>;
  abstract canHandle(intent: string, entities: string[]): boolean;

  /**
   * Register available tools for this agent
   */
  protected abstract _registerTools(): void;

  /**
   * Setup event listeners for this agent
   */
  protected _setupEventListeners(): void {
    // Override in subclasses for specific event handling
  }

  /**
   * Validate that the agent can process this request
   */
  protected _validateRequest(request: AgentRequest): { valid: boolean; error?: string } {
    if (!this._initialized) {
      return { valid: false, error: 'Agent not initialized' };
    }

    const userContext = request.context?.user;
    if (!userContext) {
      return { valid: false, error: 'No user context available' };
    }

    if (!this._security.validateUserContext(userContext)) {
      return { valid: false, error: 'Invalid user context' };
    }

    return { valid: true };
  }

  /**
   * Execute a tool with security validation
   */
  protected async _executeTool(
    toolName: string,
    params: Record<string, any>,
    userContext: any
  ): Promise<ToolResult> {
    const tool = this._tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolName}" not found`,
        executionTime: 0,
      };
    }

    // Check if user is authorized for this tool
    if (tool.requiresAuth && !this._security.isToolAllowed(toolName, userContext)) {
      return {
        success: false,
        error: `Not authorized to use "${toolName}". Required KYC level not met.`,
        executionTime: 0,
      };
    }

    // Check if confirmation is required
    if (this._security.requiresConfirmation(toolName, params)) {
      return {
        success: false,
        error: 'CONFIRMATION_REQUIRED',
        executionTime: 0,
      };
    }

    const execution: ToolExecution = {
      tool: toolName,
      params,
      executionId: generateId('tool'),
      timestamp: Date.now(),
    };

    this._eventBus.emit('asis:tool:executing', execution);

    const startTime = Date.now();
    try {
      const result = await this._runTool(toolName, params);
      const executionTime = Date.now() - startTime;

      this._eventBus.emit('asis:tool:complete', {
        ...execution,
        result,
        executionTime,
      });

      return { success: true, data: result, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';

      this._eventBus.emit('asis:tool:error', {
        ...execution,
        error: errorMessage,
        executionTime,
      });

      return { success: false, error: errorMessage, executionTime };
    }
  }

  /**
   * Override in subclasses to implement actual tool logic
   */
  protected async _runTool(toolName: string, params: Record<string, any>): Promise<any> {
    throw new Error(`Tool "${toolName}" not implemented`);
  }

  /**
   * Create a standard text response
   */
  protected _createTextResponse(content: string, metadata?: any): AgentResponse {
    return {
      content,
      type: 'text',
      metadata: { agent: this.name, version: this.version, ...metadata },
    };
  }

  /**
   * Create an action response with buttons
   */
  protected _createActionResponse(
    content: string,
    actions: Array<{ label: string; type: string; payload: any; requiresAuth?: boolean }>,
    metadata?: any
  ): AgentResponse {
    return {
      content,
      type: 'action',
      actions: actions.map((a) => ({
        id: generateId('act'),
        label: a.label,
        type: a.type as any,
        payload: a.payload,
        requiresAuth: a.requiresAuth,
      })),
      metadata: { agent: this.name, ...metadata },
    };
  }

  /**
   * Create an error response
   */
  protected _createErrorResponse(error: string, metadata?: any): AgentResponse {
    this._state.errorCount++;
    return {
      content: `I encountered an issue: ${error}. Please try again or rephrase your request.`,
      type: 'error',
      metadata: { agent: this.name, error: true, ...metadata },
    };
  }

  /**
   * Create a confirmation-required response
   */
  protected _createConfirmationResponse(
    content: string,
    pendingAction: any,
    metadata?: any
  ): AgentResponse {
    return {
      content,
      type: 'confirmation_required',
      metadata: {
        agent: this.name,
        requiresConfirmation: true,
        pendingAction,
        ...metadata,
      },
    };
  }

  /**
   * Update agent metrics
   */
  protected _updateMetrics(responseTime: number): void {
    this._state.lastRequest = Date.now();
    this._state.requestCount++;

    // Update rolling average
    const total = this._state.averageResponseTime * (this._state.requestCount - 1);
    this._state.averageResponseTime = (total + responseTime) / this._state.requestCount;
  }

  get state(): AgentState {
    return { ...this._state };
  }

  get isInitialized(): boolean {
    return this._initialized;
  }
}