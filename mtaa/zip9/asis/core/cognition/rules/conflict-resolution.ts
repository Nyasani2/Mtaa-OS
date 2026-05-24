// ============================================================
// CONFLICT RESOLUTION — Multi-agent contradictions
// Choose highest confidence + safest output
// ============================================================

import { AgentRoute, ToolCandidate } from '../types';

export interface Conflict {
  type: 'agent_contradiction' | 'tool_overlap' | 'domain_mismatch' | 'safety_violation';
  agents?: string[];
  tools?: string[];
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export class ConflictResolution {
  detectConflicts(routes: AgentRoute[], tools: ToolCandidate[]): Conflict[] {
    const conflicts: Conflict[] = [];

    // Detect agent contradictions
    const domainAgents = new Map<string, AgentRoute[]>();
    routes.forEach(r => {
      const existing = domainAgents.get(r.domain) || [];
      existing.push(r);
      domainAgents.set(r.domain, existing);
    });

    for (const [domain, agents] of domainAgents.entries()) {
      if (agents.length > 1) {
        conflicts.push({
          type: 'agent_contradiction',
          agents: agents.map(a => a.agentId),
          description: `Multiple agents for ${domain}: ${agents.map(a => a.name).join(', ')}`,
          severity: 'medium',
        });
      }
    }

    // Detect tool overlap
    const selectedTools = tools.filter(t => t.selected);
    const toolDomains = new Map<string, string[]>();
    selectedTools.forEach(t => {
      const existing = toolDomains.get(t.domain) || [];
      existing.push(t.toolId);
      toolDomains.set(t.domain, existing);
    });

    for (const [domain, toolIds] of toolDomains.entries()) {
      if (toolIds.length > 2) {
        conflicts.push({
          type: 'tool_overlap',
          tools: toolIds,
          description: `Too many tools for ${domain}: ${toolIds.join(', ')}`,
          severity: 'low',
        });
      }
    }

    // Detect domain mismatch
    const routeDomains = new Set(routes.map(r => r.domain));
    const toolDomains2 = new Set(tools.filter(t => t.selected).map(t => t.domain));
    for (const td of toolDomains2) {
      if (!routeDomains.has(td) && td !== 'general') {
        conflicts.push({
          type: 'domain_mismatch',
          description: `Tool domain ${td} has no matching agent route`,
          severity: 'high',
        });
      }
    }

    return conflicts;
  }

  resolve(conflicts: Conflict[], routes: AgentRoute[], tools: ToolCandidate[]): { routes: AgentRoute[]; tools: ToolCandidate[] } {
    let resolvedRoutes = [...routes];
    let resolvedTools = [...tools];

    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'agent_contradiction':
          resolvedRoutes = this.resolveAgentConflict(resolvedRoutes, conflict);
          break;
        case 'tool_overlap':
          resolvedTools = this.resolveToolOverlap(resolvedTools, conflict);
          break;
        case 'domain_mismatch':
          resolvedTools = this.resolveDomainMismatch(resolvedTools, conflict);
          break;
      }
    }

    return { routes: resolvedRoutes, tools: resolvedTools };
  }

  private resolveAgentConflict(routes: AgentRoute[], conflict: Conflict): AgentRoute[] {
    if (!conflict.agents) return routes;

    // Keep highest priority agent, mark others as fallback
    const conflicting = routes.filter(r => conflict.agents!.includes(r.agentId));
    const best = conflicting.sort((a, b) => a.priority - b.priority)[0];

    return routes.map(r => {
      if (conflict.agents!.includes(r.agentId) && r.agentId !== best.agentId) {
        return { ...r, executionOrder: 'sequential', dependencies: [best.agentId] };
      }
      return r;
    });
  }

  private resolveToolOverlap(tools: ToolCandidate[], conflict: Conflict): ToolCandidate[] {
    if (!conflict.tools) return tools;

    // Keep highest scoring tool per domain
    const domainTools = tools.filter(t => conflict.tools!.includes(t.toolId));
    const best = domainTools.sort((a, b) => b.score - a.score)[0];

    return tools.map(t => {
      if (conflict.tools!.includes(t.toolId) && t.toolId !== best.toolId) {
        return { ...t, selected: false };
      }
      return t;
    });
  }

  private resolveDomainMismatch(tools: ToolCandidate[], conflict: Conflict): ToolCandidate[] {
    // Deselect tools with mismatched domains
    return tools.map(t => {
      if (t.selected && !conflict.description.includes(t.domain)) {
        // Check if this tool's domain is mentioned in the conflict
        const domainInConflict = conflict.description.includes(t.domain);
        if (!domainInConflict) return { ...t, selected: false };
      }
      return t;
    });
  }
}
