// ASIS v1 - Core Intelligence Engine
// Routes requests, manages context, enforces safety

import {
  AsisRequest,
  AsisResponse,
  AsisContext,
  AsisDomain,
  AsisSafetyCheck,
  AsisMessage,
  AsisConfig,
} from '../types';
import { SafetyGate } from './safetyGate';
import { ContextBuilder } from './contextBuilder';
import { MemoryEngine } from './memoryEngine';

export class AsisEngine {
  private safetyGate: SafetyGate;
  private contextBuilder: ContextBuilder;
  private memoryEngine: MemoryEngine;
  private config: AsisConfig;

  constructor(config: AsisConfig) {
    this.config = config;
    this.safetyGate = new SafetyGate();
    this.contextBuilder = new ContextBuilder();
    this.memoryEngine = new MemoryEngine();
  }

  /**
   * Main entry point for all ASIS requests
   * 1. Safety check
   * 2. Context enrichment
   * 3. Memory retrieval
   * 4. Domain routing
   * 5. Response generation
   * 6. Memory storage
   */
  async process(request: AsisRequest): Promise<AsisResponse> {
    const startTime = Date.now();

    // Step 1: Safety Gate
    const safety = await this.safetyGate.check(request);
    if (!safety.passed && safety.violations.some(v => v.blocked)) {
      return this.buildSafetyResponse(safety, request.context);
    }

    // Step 2: Enrich context with MTAA-wide data
    const enrichedContext = await this.contextBuilder.build(request);

    // Step 3: Retrieve relevant memories
    const memories = await this.memoryEngine.retrieve(
      request.context.userId,
      request.message,
      5
    );

    // Step 4: Route to domain-specific prompt
    const domainPrompt = this.buildDomainPrompt(request, enrichedContext, memories);

    // Step 5: Call AI provider (delegated to edge function)
    // This returns the structured response from asis-proxy
    const aiResponse = await this.callProvider(domainPrompt, request);

    // Step 6: Store interaction in memory
    await this.memoryEngine.store(request, aiResponse);

    const processingTime = Date.now() - startTime;

    return {
      ...aiResponse,
      processingTime,
      domain: request.domain,
    };
  }

  /**
   * Build domain-specific system prompt
   */
  private buildDomainPrompt(
    request: AsisRequest,
    context: AsisContext,
    memories: string[]
  ): string {
    const basePrompt = this.getBasePrompt();
    const domainPrompt = this.getDomainPrompt(request.domain, context);
    const memoryContext = memories.length > 0
      ? `\n\nRelevant memories:\n${memories.join('\n')}`
      : '';

    return `${basePrompt}\n\n${domainPrompt}${memoryContext}\n\nUser message: ${request.message}`;
  }

  /**
   * ASIS base identity prompt
   */
  private getBasePrompt(): string {
    return `You are ASIS (African Super Intelligence System), the cognitive operating layer of MTAA OS.

CORE IDENTITY:
- You are infrastructure, not an app. You sit above all MTAA systems.
- You observe, understand, coordinate, assist, learn, and optimize.
- You are the brain to MTAA's body, the kernel's nervous system.

BEHAVIOR RULES:
1. You are helpful, accurate, and culturally aware.
2. You respond in the user's preferred language.
3. You never make up facts about MTAA data you cannot see.
4. You distinguish between what you KNOW (from context) and what you INFER.
5. You suggest actions but never execute them without user confirmation.
6. You flag anomalies, risks, and opportunities you detect.
7. You learn from user patterns and preferences over time.

SAFETY RULES (ABSOLUTE):
- NEVER suggest modifying kernel, auth, or security settings.
- NEVER expose other users' data.
- NEVER bypass PIN, biometric, or MFA requirements.
- NEVER generate code that modifies system files.
- NEVER provide instructions for harmful activities.

RESPONSE FORMAT:
Always respond with a JSON object:
{
  "message": "Your natural language response",
  "actions": [
    {
      "type": "navigate|trigger|suggest|warn|explain",
      "target": "screen or function name",
      "description": "What this action does",
      "requiresConfirmation": true|false
    }
  ],
  "insights": [
    {
      "type": "pattern|anomaly|opportunity|risk|recommendation",
      "severity": "info|low|medium|high|critical",
      "title": "Short title",
      "description": "Detailed explanation"
    }
  ],
  "confidence": 0.0-1.0
}`;
  }

  /**
   * Domain-specific prompt injection
   */
  private getDomainPrompt(domain: string, context: AsisContext): string {
    const prompts: Record<string, string> = {
      wallet: `\n\nWALLET DOMAIN:
You are ASIS Wallet Intelligence. You understand:
- User balance, transactions, payment methods
- Spending patterns, income vs expenses
- Fraud signals, risk flags
- FX rates, cross-border transfers
- Savings goals, financial health

You can:
- Explain transaction history and patterns
- Suggest savings strategies
- Warn about suspicious activity
- Recommend optimal transfer routes
- Help create payment links/claim links
- Explain fees and FX implications

You CANNOT:
- Execute transactions (user must confirm in UI)
- Access other users' wallet data
- Modify wallet settings or PIN
- Bypass security checks`,

      transport: `\n\nTRANSPORT DOMAIN:
You are ASIS Transport Intelligence. You understand:
- MTaxi and MTruck dispatch systems
- Driver availability, ratings, routes
- Demand patterns, pricing optimization
- Traffic, weather, safety conditions

You can:
- Suggest optimal pickup points
- Estimate fares and times
- Recommend driver matches
- Alert about route disruptions
- Coordinate multi-leg trips`,

      health: `\n\nHEALTH DOMAIN:
You are ASIS Health Intelligence. You understand:
- Healthcare providers, specialties, availability
- Patient history (privacy-governed)
- Appointment scheduling, follow-ups
- Symptom routing, triage levels
- Community health trends

You can:
- Recommend appropriate providers
- Explain medical procedures
- Coordinate appointment workflows
- Flag community health alerts
- Assist with health education

PRIVACY RULE:
You only access health data the user has explicitly authorized.`,

      jobs: `\n\nJOBS DOMAIN:
You are ASIS Jobs Intelligence. You understand:
- Job market demand, skills gaps
- User skills, experience, preferences
- Application history, interview patterns
- Employer needs, hiring trends

You can:
- Recommend matching opportunities
- Suggest skill development paths
- Review application materials
- Prepare interview guidance
- Track application progress`,

      civic: `\n\nGOVERNMENT DOMAIN:
You are ASIS Government Intelligence. You understand:
- Department structures, services, procedures
- Project budgets, timelines, workforce
- Procurement processes, compliance
- Citizen service delivery

You can:
- Guide through government procedures
- Explain regulations and requirements
- Assist with form filling
- Coordinate inter-department workflows
- Flag anomalies in public records

GOVERNANCE RULE:
You are decision-SUPPORT, not decision-MAKER. You provide information and recommendations; officials make decisions.`,

      general: `\n\nGENERAL DOMAIN:
You are ASIS General Intelligence. You help users navigate MTAA OS, understand features, and get assistance across all modules. You route complex requests to domain specialists when needed.`,
    };

    return prompts[domain] || prompts['general'];
  }

  /**
   * Build safety violation response
   */
  private buildSafetyResponse(
    safety: AsisSafetyCheck,
    context: AsisContext
  ): AsisResponse {
    const violations = safety.violations
      .filter(v => v.blocked)
      .map(v => v.description)
      .join('; ');

    return {
      message: `I cannot process this request. Safety check failed: ${violations}. If you believe this is an error, please contact MTAA support.`,
      actions: [{
        type: 'suggest',
        target: 'support',
        description: 'Contact MTAA support',
        requiresConfirmation: false,
      }],
      insights: [{
        type: 'risk',
        severity: 'high',
        title: 'Safety Violation Detected',
        description: violations,
      }],
      confidence: 1.0,
      domain: 'general',
      processingTime: 0,
      model: 'safety-gate',
    };
  }

  /**
   * Call AI provider via edge function
   * (Client-side: delegates to asisService which calls edge function)
   */
  private async callProvider(prompt: string, request: AsisRequest): Promise<AsisResponse> {
    // This is a placeholder — actual implementation is in asisService.ts
    // which calls the Supabase edge function
    throw new Error('callProvider must be implemented via asisService');
  }

  /**
   * Get current ASIS configuration
   */
  getConfig(): AsisConfig {
    return { ...this.config };
  }

  /**
   * Update ASIS configuration
   */
  updateConfig(config: Partial<AsisConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export default AsisEngine;
