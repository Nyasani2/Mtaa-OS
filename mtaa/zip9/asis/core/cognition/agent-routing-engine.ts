// ============================================================
// AGENT ROUTING — Select agents, coordinate, resolve conflicts
// Parallel execution (safe), sequential chaining, fallback agents
// ============================================================

import { IAgentRouting } from './interfaces';
import { ResolvedIntent, ToolCandidate, AgentRoute, UnifiedContext } from './types';

export class AgentRoutingEngine implements IAgentRouting {
  private agentRegistry: Map<string, AgentRoute> = new Map();

  constructor() {
    this.registerDefaultAgents();
  }

  async route(intent: ResolvedIntent, tools: ToolCandidate[], context: UnifiedContext): Promise<AgentRoute[]> {
    const routes: AgentRoute[] = [];
    const selectedTools = tools.filter(t => t.selected);

    for (const tool of selectedTools) {
      const agent = this.findAgentForTool(tool);
      if (agent) {
        routes.push({
          ...agent,
          input: {
            intent: intent.primaryIntent,
            parameters: intent.primaryIntent.parameters,
            toolId: tool.toolId,
          },
          expectedOutput: `${tool.domain}_result`,
        });
      }
    }

    // Handle multi-intent chaining
    if (intent.secondaryIntents.length > 0) {
      for (const secondary of intent.secondaryIntents) {
        const tool = tools.find(t => t.domain === secondary.domain);
        if (tool) {
          const agent = this.findAgentForTool(tool);
          if (agent) {
            routes.push({
              ...agent,
              priority: agent.priority + 1, // lower priority than primary
              executionOrder: 'sequential',
              dependencies: routes.length > 0 ? [routes[0].agentId] : [],
              input: { intent: secondary, parameters: secondary.parameters, toolId: tool.toolId },
              expectedOutput: `${secondary.domain}_result`,
            });
          }
        }
      }
    }

    return this.coordinate(routes);
  }

  async coordinate(routes: AgentRoute[]): Promise<AgentRoute[]> {
    // Determine execution order
    // Safe parallel: wallet + health can NEVER run in parallel
    // Safe parallel: transport + general CAN run in parallel

    const hasWallet = routes.some(r => r.domain === 'wallet');
    const hasHealth = routes.some(r => r.domain === 'health');

    if (hasWallet && hasHealth) {
      // Force sequential: wallet first, then health
      routes.forEach(r => {
        if (r.domain === 'health') {
          r.executionOrder = 'sequential';
          r.dependencies = routes.filter(x => x.domain === 'wallet').map(x => x.agentId);
        }
      });
    }

    // Sort by priority
    routes.sort((a, b) => a.priority - b.priority);

    return routes;
  }

  resolveConflicts(routes: AgentRoute[]): AgentRoute[] {
    // Remove duplicate agents for same domain
    const seenDomains = new Set<string>();
    const resolved: AgentRoute[] = [];

    for (const route of routes) {
      if (seenDomains.has(route.domain)) {
        // Keep the one with higher priority (lower number)
        const existing = resolved.find(r => r.domain === route.domain);
        if (existing && route.priority < existing.priority) {
          const idx = resolved.indexOf(existing);
          resolved[idx] = route;
        }
      } else {
        seenDomains.add(route.domain);
        resolved.push(route);
      }
    }

    return resolved;
  }

  getFallback(route: AgentRoute): string | undefined {
    return route.fallbackAgentId;
  }

  private findAgentForTool(tool: ToolCandidate): AgentRoute | undefined {
    for (const [_, agent] of this.agentRegistry) {
      if (agent.domain === tool.domain) {
        return { ...agent };
      }
    }
    return undefined;
  }

  private registerDefaultAgents(): void {
    const agents: Omit<AgentRoute, 'input' | 'expectedOutput'>[] = [
      { agentId: 'agent_wallet', name: 'WalletAgent', domain: 'wallet', priority: 1, executionOrder: 'sequential', dependencies: [], fallbackAgentId: 'agent_general' },
      { agentId: 'agent_health', name: 'HealthAgent', domain: 'health', priority: 2, executionOrder: 'sequential', dependencies: [], fallbackAgentId: 'agent_general' },
      { agentId: 'agent_transport', name: 'TransportAgent', domain: 'transport', priority: 3, executionOrder: 'parallel', dependencies: [], fallbackAgentId: 'agent_general' },
      { agentId: 'agent_cash', name: 'CashAgent', domain: 'cash', priority: 4, executionOrder: 'sequential', dependencies: [], fallbackAgentId: 'agent_general' },
      { agentId: 'agent_civic', name: 'CivicAgent', domain: 'civic', priority: 5, executionOrder: 'sequential', dependencies: [], fallbackAgentId: 'agent_general' },
      { agentId: 'agent_general', name: 'GeneralAgent', domain: 'general', priority: 99, executionOrder: 'parallel', dependencies: [], },
    ];

    agents.forEach(a => this.agentRegistry.set(a.agentId, { ...a, input: {}, expectedOutput: '' }));
  }
}
