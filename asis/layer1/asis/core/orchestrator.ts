/**
 * ASIS Orchestrator
 * Central coordination layer — routes requests to agents, manages execution flow
 */

import { ASISEventBus } from './event-bus';
import { ASISContextEngine } from './context-engine';
import { ASISSecurityLayer } from '../security/security-layer';
import { AgentRequest, AgentResponse, OrchestratorDecision } from '../shared/types';

export interface OrchestratorOptions {
  maxConcurrentExecutions: number;
  defaultTimeoutMs: number;
  retryAttempts: number;
}

export class ASISOrchestrator {
  private _eventBus: ASISEventBus;
  private _context: ASISContextEngine;
  private _security: ASISSecurityLayer;
  private _options: OrchestratorOptions;
  private _activeExecutions: Map<string, any> = new Map();
  private _agentRegistry: Map<string, any> = new Map();
  private _initialized: boolean = false;

  constructor(
    eventBus: ASISEventBus,
    context: ASISContextEngine,
    security: ASISSecurityLayer,
    options?: Partial<OrchestratorOptions>
  ) {
    this._eventBus = eventBus;
    this._context = context;
    this._security = security;
    this._options = {
      maxConcurrentExecutions: 5,
      defaultTimeoutMs: 30000,
      retryAttempts: 2,
      ...options,
    };
  }

  async initialize(): Promise<void> {
    this._setupEventListeners();
    this._initialized = true;
    console.log('[ASIS:Orchestrator] Initialized');
  }

  async shutdown(): Promise<void> {
    for (const [id, execution] of this._activeExecutions) {
      execution.cancel?.();
    }
    this._activeExecutions.clear();
    this._initialized = false;
    console.log('[ASIS:Orchestrator] Shutdown');
  }

  private _setupEventListeners(): void {
    this._eventBus.on('asis:agent:request', (event) => {
      this._handleAgentRequest(event.payload);
    });

    this._eventBus.on('asis:tool:execute', (event) => {
      this._handleToolExecution(event.payload);
    });

    this._eventBus.on('asis:command', (event) => {
      this._handleSystemCommand(event.payload);
    });
  }

  registerAgent(name: string, agent: any): void {
    if (this._agentRegistry.has(name)) {
      console.warn(`[ASIS:Orchestrator] Agent "${name}" already registered. Overwriting.`);
    }
    this._agentRegistry.set(name, agent);
    console.log(`[ASIS:Orchestrator] Agent registered: ${name}`);
  }

  unregisterAgent(name: string): void {
    this._agentRegistry.delete(name);
  }

  async processUserInput(input: string, sessionId?: string): Promise<AgentResponse> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const snapshot = this._context.getSnapshot();
      const intentResult = this._context.detectIntent(input);
      const decision = this._makeRoutingDecision(input, intentResult, snapshot);
      const response = await this._executeWithAgent(decision, input, snapshot, executionId);

      if (sessionId || snapshot.sessionId) {
        this._context.addMessage(
          sessionId || snapshot.sessionId,
          'asis',
          response.content,
          { intent: intentResult.intent, entities: intentResult.entities }
        );
      }

      return response;
    } catch (error) {
      console.error(`[ASIS:Orchestrator] Execution ${executionId} failed:`, error);
      return {
        content: 'I apologize, but I encountered an issue processing your request. Please try again.',
        type: 'error',
        metadata: { error: true, executionId },
      };
    }
  }

  private _makeRoutingDecision(
    input: string,
    intent: { intent: string; confidence: number; entities: string[] },
    snapshot: any
  ): OrchestratorDecision {
    const availableAgents = Array.from(this._agentRegistry.keys());

    const intentAgentMap: Record<string, string> = {
      wallet: 'wallet_agent',
      transport: 'transport_agent',
      jobs: 'jobs_agent',
      health: 'health_agent',
      civic: 'civic_agent',
      engineering: 'engineering_agent',
      help: 'navigator_agent',
      general: 'navigator_agent',
    };

    const targetAgent = intentAgentMap[intent.intent] || 'navigator_agent';

    return {
      targetAgent,
      confidence: intent.confidence,
      intent: intent.intent,
      entities: intent.entities,
      requiresConfirmation: this._requiresConfirmation(intent.intent, intent.entities),
      fallbackAgents: availableAgents.filter((a) => a !== targetAgent).slice(0, 2),
    };
  }

  private _requiresConfirmation(intent: string, entities: string[]): boolean {
    if (intent === 'wallet' && entities.some((e) => ['transfer', 'payment'].includes(e))) {
      return true;
    }
    if (intent === 'health' && entities.some((e) => ['appointment', 'symptom_check'].includes(e))) {
      return true;
    }
    if (intent === 'civic' && entities.some((e) => ['permit', 'license'].includes(e))) {
      return true;
    }
    return false;
  }

  private async _executeWithAgent(
    decision: OrchestratorDecision,
    input: string,
    snapshot: any,
    executionId: string
  ): Promise<AgentResponse> {
    const agent = this._agentRegistry.get(decision.targetAgent);

    if (!agent) {
      const navigator = this._agentRegistry.get('navigator_agent');
      if (navigator) {
        return navigator.process({ input, snapshot, executionId, decision });
      }

      return {
        content: `I'm not sure how to help with that yet. I can assist with wallet, transport, jobs, health, and civic services. What would you like to do?`,
        type: 'text',
        metadata: { fallback: true, executionId },
      };
    }

    if (decision.requiresConfirmation) {
      return {
        content: `This action involves ${decision.intent} and requires your confirmation. Please verify with your PIN or biometric to proceed.`,
        type: 'confirmation_required',
        metadata: {
          requiresConfirmation: true,
          intent: decision.intent,
          executionId,
          pendingAction: {
            agent: decision.targetAgent,
            input,
            decision,
          },
        },
      };
    }

    const request: AgentRequest = {
      input,
      context: snapshot,
      executionId,
      decision,
      timestamp: Date.now(),
    };

    return agent.process(request);
  }

  private async _handleAgentRequest(payload: any): Promise<void> {
    const { agentName, request } = payload;
    const agent = this._agentRegistry.get(agentName);

    if (agent) {
      const response = await agent.process(request);
      this._eventBus.emit('asis:agent:response', {
        agentName,
        response,
        executionId: request.executionId,
      });
    } else {
      this._eventBus.emit('asis:agent:error', {
        agentName,
        error: 'Agent not found',
        executionId: request.executionId,
      });
    }
  }

  private async _handleToolExecution(payload: any): Promise<void> {
    const { tool, params, executionId } = payload;

    if (!this._security.isToolAllowed(tool, this._context.getUserContext())) {
      this._eventBus.emit('asis:tool:error', {
        tool,
        error: 'Tool not authorized',
        executionId,
      });
      return;
    }

    this._eventBus.emit('asis:tool:executing', { tool, executionId });
  }

  private _handleSystemCommand(payload: any): void {
    const { command, params } = payload;

    switch (command) {
      case 'status':
        this._eventBus.emit('asis:orchestrator:status', {
          activeExecutions: this._activeExecutions.size,
          registeredAgents: Array.from(this._agentRegistry.keys()),
          timestamp: Date.now(),
        });
        break;

      case 'cancel':
        const execution = this._activeExecutions.get(params.executionId);
        if (execution) {
          execution.cancel?.();
          this._activeExecutions.delete(params.executionId);
        }
        break;

      default:
        console.warn(`[ASIS:Orchestrator] Unknown system command: ${command}`);
    }
  }

  get registeredAgents(): string[] {
    return Array.from(this._agentRegistry.keys());
  }

  get activeExecutions(): number {
    return this._activeExecutions.size;
  }
}
