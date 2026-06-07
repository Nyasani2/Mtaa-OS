import { BaseAgent, AgentResponse, UserContext } from './base-agent';
import { IntentClassification } from './routing/intent-classifier';
import { Text } from 'react-native';


export class NavigatorAgent extends BaseAgent {
  private _faqDatabase: Map<string, string> = new Map();

  constructor() {
    super('navigator', 'MTAA Navigator');
    this._initFaq();
  }

  private _initFaq(): void {
    this._faqDatabase.set('what can you do', 
      `I can help you with:

- Wallet — Check balance, send money, pay bills, view transactions
- Transport — Book MTaxi rides, MTruck deliveries, track your trips
- Jobs — Search jobs, apply, post listings, get salary estimates
- Health — Book appointments, find doctors, access health records
- Civic — Permits, licenses, police reports, court info

Just tell me what you need!`);

    this._faqDatabase.set('help', 'I can navigate you through any MTAA service. What do you need help with?');
    this._faqDatabase.set('wallet', 'Go to Wallet to check balance, send money, or pay bills.');
    this._faqDatabase.set('transport', 'Go to Transport to book MTaxi rides or MTruck deliveries.');
    this._faqDatabase.set('jobs', 'Go to Jobs to search listings or post opportunities.');
    this._faqDatabase.set('health', 'Go to Health to book appointments or find doctors.');
    this._faqDatabase.set('civic', 'Go to Civic for permits, licenses, and government services.');
  }

  async process(input: string, userContext: UserContext): Promise<AgentResponse> {
    const normalized = input.toLowerCase().trim();
    
    // Check FAQ database first
    if (this._faqDatabase.has(normalized)) {
      return this._createTextResponse(this._faqDatabase.get(normalized)!);
    }

    // Route to appropriate agent
    const intent = await this._classifyIntent(normalized);
    
    switch (intent) {
      case 'wallet':
        return this._routeToAgent('wallet', input, userContext);
      case 'transport':
        return this._routeToAgent('transport', input, userContext);
      case 'jobs':
        return this._routeToAgent('jobs', input, userContext);
      case 'health':
        return this._routeToAgent('health', input, userContext);
      case 'civic':
        return this._routeToAgent('civic', input, userContext);
      default:
        return this._createTextResponse(
          `I'm not sure I understood. I can help with:
- Wallet (balance, send, pay)
- Transport (taxi, truck)
- Jobs (search, apply)
- Health (appointments)
- Civic (permits, licenses)

What would you like to do?`
        );
    }
  }

  private async _classifyIntent(input: string): Promise<string> {
    // Simple keyword-based classification
    const keywords: Record<string, string[]> = {
      wallet: ['balance', 'send', 'pay', 'money', 'transfer', 'deposit', 'withdraw'],
      transport: ['taxi', 'ride', 'truck', 'delivery', 'transport', 'mtaxi', 'mtruck'],
      jobs: ['job', 'work', 'hire', 'salary', 'employment', 'career'],
      health: ['doctor', 'hospital', 'appointment', 'health', 'medical', 'clinic'],
      civic: ['permit', 'license', 'police', 'court', 'government', 'tax', 'revenue']
    };

    for (const [intent, words] of Object.entries(keywords)) {
      if (words.some(w => input.includes(w))) {
        return intent;
      }
    }

    return 'unknown';
  }

  private _routeToAgent(agentId: string, input: string, userContext: UserContext): AgentResponse {
    return {
      type: 'route',
      content: `Routing to ${agentId} agent...`,
      data: { agentId, originalInput: input, userContext },
      confidence: 0.9
    };
  }
}