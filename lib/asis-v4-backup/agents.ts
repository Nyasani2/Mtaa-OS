/**
 * ASIS v4 Agent Swarm
 * 8 specialized agents coordinate on complex tasks
 */

import { asisEngine, InferenceResult } from './engine';

export type AgentType =
  | 'math' | 'vision' | 'web' | 'voice' | 'code' | 'science' | 'wallet' | 'market';

export interface AgentTask {
  id: string;
  type: AgentType;
  query: string;
  context: Record<string, any>;
  priority: number; // 1-10
}

export interface SwarmResult {
  taskId: string;
  agent: AgentType;
  result: InferenceResult | any;
  confidence: number;
  executionTime: number;
}

export class AgentSwarm {
  private agents: Map<AgentType, (task: AgentTask) => Promise<any>> = new Map();

  constructor() {
    this.registerAgent('math', this.mathAgent);
    this.registerAgent('vision', this.visionAgent);
    this.registerAgent('web', this.webAgent);
    this.registerAgent('voice', this.voiceAgent);
    this.registerAgent('code', this.codeAgent);
    this.registerAgent('science', this.scienceAgent);
    this.registerAgent('wallet', this.walletAgent);
    this.registerAgent('market', this.marketAgent);
  }

  private registerAgent(type: AgentType, handler: (task: AgentTask) => Promise<any>) {
    this.agents.set(type, handler.bind(this));
  }

  async dispatch(query: string, context: { module?: string; userId?: string } = {}): Promise<SwarmResult[]> {
    const tasks = this.decompose(query);
    const results: SwarmResult[] = [];

    // Execute in parallel
    const promises = tasks.map(async (task) => {
      const start = Date.now();
      const handler = this.agents.get(task.type);
      if (!handler) return null;

      try {
        const result = await handler(task);
        return {
          taskId: task.id,
          agent: task.type,
          result,
          confidence: result?.confidence || 0.5,
          executionTime: Date.now() - start,
        };
      } catch (error) {
        return {
          taskId: task.id,
          agent: task.type,
          result: { answer: `Error: ${error instanceof Error ? error.message : 'Unknown'}`, confidence: 0 },
          confidence: 0,
          executionTime: Date.now() - start,
        };
      }
    });

    const settled = await Promise.all(promises);
    for (let i = 0; i < settled.length; i++) {
      if (settled[i]) results.push(settled[i] as SwarmResult);
    }

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);
    return results;
  }

  private decompose(query: string): AgentTask[] {
    const lower = query.toLowerCase();
    const tasks: AgentTask[] = [];
    const baseId = `task-${Date.now()}`;

    // Detect which agents to activate
    if (lower.includes('calculate') || lower.includes('solve') || /[0-9]/.test(lower)) {
      tasks.push({ id: `${baseId}-math`, type: 'math', query, context: {}, priority: 8 });
    }
    if (lower.includes('image') || lower.includes('draw') || lower.includes('picture') || lower.includes('photo')) {
      tasks.push({ id: `${baseId}-vision`, type: 'vision', query, context: {}, priority: 7 });
    }
    if (lower.includes('web') || lower.includes('internet') || lower.includes('site') || lower.includes('url')) {
      tasks.push({ id: `${baseId}-web`, type: 'web', query, context: {}, priority: 6 });
    }
    if (lower.includes('code') || lower.includes('program') || lower.includes('function') || lower.includes('bug')) {
      tasks.push({ id: `${baseId}-code`, type: 'code', query, context: {}, priority: 8 });
    }
    if (lower.includes('wallet') || lower.includes('transfer') || lower.includes('payment') || lower.includes('fraud')) {
      tasks.push({ id: `${baseId}-wallet`, type: 'wallet', query, context: {}, priority: 9 });
    }
    if (lower.includes('market') || lower.includes('trade') || lower.includes('stock') || lower.includes('price')) {
      tasks.push({ id: `${baseId}-market`, type: 'market', query, context: {}, priority: 7 });
    }
    if (lower.includes('physics') || lower.includes('chemistry') || lower.includes('biology') || lower.includes('science')) {
      tasks.push({ id: `${baseId}-science`, type: 'science', query, context: {}, priority: 7 });
    }

    // Always add general if no specific agents triggered
    if (tasks.length === 0) {
      tasks.push({ id: `${baseId}-general`, type: 'science', query, context: {}, priority: 5 });
    }

    return tasks;
  }

  private async mathAgent(task: AgentTask): Promise<InferenceResult> {
    return asisEngine.infer(task.query, {
      module: 'math',
      userId: task.context.userId || '',
      sessionId: task.id,
      previousQueries: [],
      intent: 'calculation',
      entities: {},
    });
  }

  private async visionAgent(task: AgentTask): Promise<InferenceResult> {
    return asisEngine.infer(task.query, {
      module: 'vision',
      userId: task.context.userId || '',
      sessionId: task.id,
      previousQueries: [],
      intent: 'visual',
      entities: {},
    });
  }

  private async webAgent(task: AgentTask): Promise<InferenceResult> {
    return asisEngine.infer(task.query, {
      module: 'web',
      userId: task.context.userId || '',
      sessionId: task.id,
      previousQueries: [],
      intent: 'web',
      entities: {},
    });
  }

  private async voiceAgent(task: AgentTask): Promise<InferenceResult> {
    return asisEngine.infer(task.query, {
      module: 'voice',
      userId: task.context.userId || '',
      sessionId: task.id,
      previousQueries: [],
      intent: 'voice',
      entities: {},
    });
  }

  private async codeAgent(task: AgentTask): Promise<InferenceResult> {
    return asisEngine.infer(task.query, {
      module: 'code',
      userId: task.context.userId || '',
      sessionId: task.id,
      previousQueries: [],
      intent: 'code',
      entities: {},
    });
  }

  private async scienceAgent(task: AgentTask): Promise<InferenceResult> {
    return asisEngine.infer(task.query, {
      module: 'science',
      userId: task.context.userId || '',
      sessionId: task.id,
      previousQueries: [],
      intent: 'definition',
      entities: {},
    });
  }

  private async walletAgent(task: AgentTask): Promise<InferenceResult> {
    return asisEngine.infer(task.query, {
      module: 'wallet',
      userId: task.context.userId || '',
      sessionId: task.id,
      previousQueries: [],
      intent: 'wallet',
      entities: {},
    });
  }

  private async marketAgent(task: AgentTask): Promise<InferenceResult> {
    return asisEngine.infer(task.query, {
      module: 'market',
      userId: task.context.userId || '',
      sessionId: task.id,
      previousQueries: [],
      intent: 'market',
      entities: {},
    });
  }
}

export const agentSwarm = new AgentSwarm();
