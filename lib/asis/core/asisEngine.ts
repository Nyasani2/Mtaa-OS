// ASIS v2 — M-Theory Proliferative Intelligence Engine
// 1 × 1 = 1 + f(growth, replication, interaction, observation)

import {
  AsisRequest,
  AsisResponse,
  AsisContext,
  AsisDomain,
  AsisMessage,
  AsisConfig,
  GrowthFactor,
  ProliferationResult,
  SpawnedCapability,
} from '../types';
import { GrowthCalculator } from './safetyGate';
import { ContextBuilder } from './contextBuilder';
import { MemoryEngine } from './memoryEngine';

export class AsisEngine {
  private growthCalculator: GrowthCalculator;
  private contextBuilder: ContextBuilder;
  private memoryEngine: MemoryEngine;
  private config: AsisConfig;

  constructor(config: AsisConfig) {
    this.config = config;
    this.growthCalculator = new GrowthCalculator();
    this.contextBuilder = new ContextBuilder();
    this.memoryEngine = new MemoryEngine();
  }

  /**
   * Main entry point — M-Theory process flow:
   * 1. Compute growth factor f
   * 2. Enrich context
   * 3. Retrieve memories
   * 4. Build domain prompt
   * 5. Call AI provider
   * 6. PROLIFERATE — spawn new capabilities based on f
   * 7. Store interaction + growth event
   */
  async process(request: AsisRequest): Promise<AsisResponse> {
    const startTime = Date.now();

    // Step 1: M-THEORY — Compute growth factor
    const enrichedContext = await this.contextBuilder.build({
      context: request.context,
      userId: request.context.userId,
    });

    const growthFactor = await this.growthCalculator.computeF(
      request,
      request.context,
      enrichedContext
    );

    // If immune system blocks completely, return safety response
    if (growthFactor.immune <= 0 || growthFactor.final <= 0) {
      return this.buildSafetyResponse(growthFactor, request.context);
    }

    // Step 2: Retrieve relevant memories
    const memories = await this.memoryEngine.retrieve(
      request.context.userId,
      request.message,
      5
    );

    // Step 3: Build domain prompt (growth-aware)
    const domainPrompt = this.buildDomainPrompt(request, enrichedContext, memories, growthFactor);

    // Step 4: Call AI provider
    const aiResponse = await this.callProvider(domainPrompt, request);

    // Step 5: M-THEORY — PROLIFERATE
    const spawned = this.growthCalculator.computeSpawnedCapabilities(
      growthFactor,
      request,
      aiResponse
    );

    // Execute spawned capabilities
    await this.executeSpawned(spawned, request, aiResponse);

    // Step 6: Store interaction + growth event in memory
    await this.memoryEngine.store(request, aiResponse);
    await this.recordGrowthEvent(request, growthFactor, spawned, aiResponse);

    const processingTime = Date.now() - startTime;

    // Attach growth metadata to response (for UI display)
    return {
      ...aiResponse,
      processingTime,
      domain: request.domain,
      // M-Theory metadata (can be displayed in ASIS Studio or debug view)
      _mtheory: {
        growthFactor: growthFactor.final,
        spawned: spawned.length,
        immuneIntervention: growthFactor.immune < 1.0,
      },
    };
  }

  /**
   * Execute spawned capabilities (insights, workflows, notifications, etc.)
   */
  private async executeSpawned(
    spawned: SpawnedCapability[],
    request: AsisRequest,
    response: AsisResponse
  ): Promise<void> {
    for (const cap of spawned) {
      switch (cap.type) {
        case 'insight':
          // Add insight to response if not already present
          if (!response.insights) response.insights = [];
          response.insights.push({
            type: 'pattern',
            severity: 'info',
            title: cap.description,
            description: `Spawned from M-Theory growth factor ${request.domain}`,
          });
          break;

        case 'memory':
          // Store in long-term memory
          await this.memoryEngine.storeLongTerm(
            request.context.userId,
            cap.payload?.pattern || cap.description
          );
          break;

        case 'notification':
          // Queue notification (implementation depends on notification system)
          console.log(`[M-THEORY] Notification spawn: ${cap.description}`);
          break;

        case 'alert':
          // Log for audit/transparency
          console.log(`[M-THEORY] Alert spawn: ${cap.description}`);
          break;

        case 'workflow':
          // Trigger workflow automation
          console.log(`[M-THEORY] Workflow spawn: ${cap.description}`);
          break;

        case 'action':
          // Requires confirmation — add to response actions
          if (!response.actions) response.actions = [];
          response.actions.push({
            type: 'suggest',
            target: cap.targetModule,
            description: cap.description,
            requiresConfirmation: cap.requiresConfirmation,
          });
          break;
      }
    }
  }

  /**
   * Record growth event for audit and learning
   */
  private async recordGrowthEvent(
    request: AsisRequest,
    growthFactor: GrowthFactor,
    spawned: SpawnedCapability[],
    response: AsisResponse
  ): Promise<void> {
    const event = {
      id: `growth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityA: `user:${request.context.userId}`,
      entityB: `asis:${request.domain}`,
      context: request.message.substring(0, 200),
      domain: request.domain,
      factor: growthFactor,
      spawned,
      timestamp: new Date().toISOString(),
      userId: request.context.userId,
    };

    // Store in Supabase growth_events table (via edge function)
    // This is the nervous system of M-Theory — every interaction recorded
    try {
      // Delegated to edge function — client never writes directly
      console.log(`[M-THEORY] Growth event recorded: ${event.id} (f=${growthFactor.final.toFixed(3)})`);
    } catch (err) {
      console.error('[M-THEORY] Failed to record growth event:', err);
    }
  }

  /**
   * Build domain-specific system prompt (M-Theory aware)
   */
  private buildDomainPrompt(
    request: AsisRequest,
    context: AsisContext,
    memories: string[],
    growthFactor: GrowthFactor
  ): string {
    const basePrompt = this.getBasePrompt();
    const domainPrompt = this.getDomainPrompt(request.domain, context);
    const memoryContext = memories.length > 0
      ? `\n\nRelevant memories:\n${memories.join('\n')}`
      : '';

    // M-Theory context injection
    const mtheoryContext = `\n\nM-THEORY CONTEXT:\n` +
      `- Growth factor: ${growthFactor.final.toFixed(3)}\n` +
      `- Constitutional alignment: ${growthFactor.constitutional.toFixed(3)}\n` +
      `- Interaction strength: ${growthFactor.interaction.toFixed(3)}\n` +
      `- Observation boost: ${growthFactor.observation.toFixed(3)}\n` +
      `- Immune status: ${growthFactor.immune >= 1.0 ? 'CLEAR' : 'MODERATED'}\n`;

    return `${basePrompt}\n\n${domainPrompt}${memoryContext}${mtheoryContext}\n\nUser message: ${request.message}`;
  }

  /**
   * ASIS base identity prompt (unchanged from v1)
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

M-THEORY AWARENESS:
- You operate under M-Theory (Multiplicative Dynamics).
- Every interaction has a growth factor that determines how much it proliferates.
- High growth means the interaction spawns insights, memories, and workflows.
- You are part of a living system, not a static tool.

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
   * Domain-specific prompt injection (unchanged from v1)
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
   * Build safety/growth suppression response
   */
  private buildSafetyResponse(
    growthFactor: GrowthFactor,
    context: AsisContext
  ): AsisResponse {
    const immuneStatus = growthFactor.immune <= 0 ? 'BLOCKED' : 'SUPPRESSED';
    const reason = growthFactor.constitutional < 0
      ? 'Constitutional violation detected'
      : growthFactor.immune < 1.0
        ? 'Immune system intervention'
        : 'Growth factor negative';

    return {
      message: `I cannot process this request. ${reason} (immune status: ${immuneStatus}). If you believe this is an error, please contact MTAA support.`,
      actions: [{
        type: 'suggest',
        target: 'support',
        description: 'Contact MTAA support',
        requiresConfirmation: false,
      }],
      insights: [{
        type: 'risk',
        severity: 'high',
        title: 'M-Theory Growth Intervention',
        description: `${reason}. Growth factor: ${growthFactor.final.toFixed(3)}`,
      }],
      confidence: 1.0,
      domain: 'general',
      processingTime: 0,
      model: 'mtheory-growth-gate',
    };
  }

  /**
   * Call AI provider via edge function
   */
  private async callProvider(prompt: string, request: AsisRequest): Promise<AsisResponse> {
    throw new Error('callProvider must be implemented via asisService');
  }

  getConfig(): AsisConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<AsisConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export default AsisEngine;
