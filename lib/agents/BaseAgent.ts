// @ts-nocheck
export interface AgentResponse {
  success: boolean;
  data?: any;
  message: string;
  error?: string;
}

export abstract class BaseAgent {
  abstract name: string;
  abstract description: string;
  
  // Every agent must have an execute method
  abstract execute(query: string, context?: any): Promise<AgentResponse>;
}
