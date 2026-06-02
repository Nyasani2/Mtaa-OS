/**
 * OrchestratorAgent
 * Multi-agent coordination, delegation, and complex workflow management
 * Handles requests that span multiple domains
 */

import { BaseAgent } from './base-agent';
import { AgentRequest, AgentResponse } from '../shared/types';
import { ASISEventBus } from '../core/event-bus';
import { ASISSecurityLayer } from '../security/security-layer';

export class OrchestratorAgent extends BaseAgent {
  readonly name = 'orchestrator_agent';
  readonly version = '1.0.0';
  readonly capabilities = [
    'multi_agent_coordination',
    'workflow_management',
    'complex_task_decomposition',
    'cross_domain_reasoning',
    'parallel_execution',
    'result_aggregation',
  ];

  private _subAgents: Map<string, BaseAgent> = new Map();

  constructor(eventBus: ASISEventBus, security: ASISSecurityLayer) {
    super(eventBus, security);
  }

  registerSubAgent(agent: BaseAgent): void {
    this._subAgents.set(agent.name, agent);
  }

  protected _registerTools(): void {
    this._tools.set('delegate', {
      name: 'delegate',
      description: 'Delegate task to sub-agent',
      parameters: [
        { name: 'agent', type: 'string', description: 'Target agent name', required: true },
        { name: 'task', type: 'string', description: 'Task description', required: true },
        { name: 'context', type: 'object', description: 'Shared context', required: false },
      ],
      returns: { type: 'object', description: 'Delegation result' },
      requiresAuth: true,
      riskLevel: 'medium',
    });

    this._tools.set('aggregate', {
      name: 'aggregate',
      description: 'Aggregate results from multiple agents',
      parameters: [
        { name: 'results', type: 'array', description: 'Results to aggregate', required: true },
      ],
      returns: { type: 'object', description: 'Aggregated result' },
      requiresAuth: false,
      riskLevel: 'low',
    });
  }

  canHandle(intent: string, entities: string[]): boolean {
    // Orchestrator handles complex multi-domain requests
    return intent === 'complex' || entities.length > 2;
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const validation = this._validateRequest(request);

    if (!validation.valid) {
      return this._createErrorResponse(validation.error || 'Invalid request');
    }

    this._state.status = 'processing';
    const { input, context } = request;

    try {
      // Detect if this is a multi-domain request
      const domains = this._detectDomains(input);

      if (domains.length > 1) {
        return await this._handleMultiDomainRequest(input, domains, context);
      }

      // Single domain — delegate to appropriate agent
      const targetAgent = domains[0] ? this._subAgents.get(`${domains[0]}_agent`) : null;
      if (targetAgent) {
        return await targetAgent.process(request);
      }

      // Fallback to navigator
      const navigator = this._subAgents.get('navigator_agent');
      if (navigator) {
        return await navigator.process(request);
      }

      return this._createTextResponse(
        'I am coordinating your request. One moment...',
        { type: 'orchestrating' }
      );
    } catch (error) {
      this._state.status = 'error';
      return this._createErrorResponse(
        error instanceof Error ? error.message : 'Orchestration failed'
      );
    } finally {
      this._updateMetrics(Date.now() - startTime);
      this._state.status = 'idle';
    }
  }

  private _detectDomains(input: string): string[] {
    const domainKeywords: Record<string, string[]> = {
      wallet: ['money', 'send', 'pay', 'balance', 'transfer'],
      transport: ['taxi', 'ride', 'truck', 'delivery', 'driver'],
      jobs: ['job', 'work', 'hire', 'salary', 'cv'],
      health: ['doctor', 'hospital', 'appointment', 'symptom'],
      civic: ['police', 'court', 'permit', 'license'],
      engineering: ['plan', 'design', 'simulate', 'infrastructure'],
    };

    const lower = input.toLowerCase();
    const detected: string[] = [];

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some((k) => lower.includes(k))) {
        detected.push(domain);
      }
    }

    return detected;
  }

  private async _handleMultiDomainRequest(
    input: string,
    domains: string[],
    context: any
  ): Promise<AgentResponse> {
    // Example: "Book a taxi to the hospital and pay with my wallet"

    const responses: AgentResponse[] = [];

    for (const domain of domains) {
      const agent = this._subAgents.get(`${domain}_agent`);
      if (agent) {
        const subRequest: AgentRequest = {
          input,
          context,
          executionId: `sub_${Date.now()}`,
          decision: {
            targetAgent: agent.name,
            confidence: 0.8,
            intent: domain,
            entities: [],
            requiresConfirmation: false,
            fallbackAgents: [],
          },
          timestamp: Date.now(),
        };

        const response = await agent.process(subRequest);
        responses.push(response);
      }
    }

    // Aggregate responses
    const aggregated = this._aggregateResponses(responses);

    return this._createTextResponse(
      `**Multi-step Request**\n\n${aggregated}\n\n` +
      `I have coordinated ${domains.length} services for you. ` +
      `Please review and confirm each step.`,
      { type: 'multi_domain', domains }
    );
  }

  private _aggregateResponses(responses: AgentResponse[]): string {
    return responses
      .map((r) => `• ${r.content.substring(0, 100)}...`)
      .join('\n');
  }
}
