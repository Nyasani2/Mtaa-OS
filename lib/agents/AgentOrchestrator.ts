// @ts-nocheck
import { BaseAgent, AgentResponse } from './BaseAgent';
import { WalletAgent } from './WalletAgent';
import { CreativeAgent } from './CreativeAgent';

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();

  constructor() {
    // Hire the workers
    this.registerAgent(new WalletAgent());
    this.registerAgent(new CreativeAgent());
  }

  registerAgent(agent: BaseAgent) {
    this.agents.set(agent.name, agent);
  }

  // ASIS calls this to delegate tasks
  async delegateTask(intent: string, query: string, context: any): Promise<AgentResponse> {
    const targetAgent = this.selectBestAgent(intent);
    if (!targetAgent) {
      return { success: false, message: "No specialized agent found for this task.", error: "UNKNOWN_INTENT" };
    }
    
    console.log(`[Orchestrator] Delegating to ${targetAgent.name}...`);
    return await targetAgent.execute(query, context);
  }

  private selectBestAgent(intent: string): BaseAgent | null {
    const lowerIntent = intent.toLowerCase();
    
    if (lowerIntent.includes('balance') || lowerIntent.includes('pay') || lowerIntent.includes('transfer') || lowerIntent.includes('wallet')) {
      return this.agents.get('WalletAgent') || null;
    }
    if (lowerIntent.includes('image') || lowerIntent.includes('video') || lowerIntent.includes('generate') || lowerIntent.includes('picture')) {
      return this.agents.get('CreativeAgent') || null;
    }
    
    return null; // Fallback to ASIS's own brain
  }
}

export const agentOrchestrator = new AgentOrchestrator();
