// ============================================================
// RESPONSE PLANNER — Structured ASIS response generation
// Final answer + explanation + actions + confidence + fallback
// ============================================================

import { IResponsePlanner } from './interfaces';
import { CognitiveState, ResponsePlan, ConfidenceLevel } from './types';
import { ASISBehaviorGuard } from '../behavior/asis-behavior-rules';

export class ResponsePlanner implements IResponsePlanner {
  private behaviorGuard: ASISBehaviorGuard;

  constructor(behaviorGuard: ASISBehaviorGuard) {
    this.behaviorGuard = behaviorGuard;
  }

  async plan(state: CognitiveState): Promise<ResponsePlan> {
    const response = await this.generateResponse(state);
    const explanation = await this.generateExplanation(state);
    const confidenceScore = await this.calculateConfidence(state);
    const confidence = this.mapConfidenceLevel(confidenceScore);

    const toolsUsed = state.selectedTools.filter(t => t.selected).map(t => t.toolId);
    const agentsTriggered = state.agentRoutes.map(r => r.agentId);

    const suggestedActions = this.generateSuggestedActions(state);
    const fallbackSuggestion = this.generateFallback(state);
    const requiresUserInput = state.intent?.requiresConfirmation || false;

    // Determine safety level from checks
    const hasDanger = state.safetyChecks.some(c => c.riskLevel === 'danger');
    const hasCaution = state.safetyChecks.some(c => c.riskLevel === 'caution');
    const safetyLevel = hasDanger ? 'danger' : hasCaution ? 'caution' : 'safe';

    return {
      finalResponse: response,
      explanation,
      confidence,
      confidenceScore,
      toolsUsed,
      agentsTriggered,
      suggestedActions,
      fallbackSuggestion,
      requiresUserInput,
      safetyLevel,
    };
  }

  async generateResponse(state: CognitiveState): Promise<string> {
    const intent = state.intent?.primaryIntent;
    const perception = state.perception;

    if (!intent) {
      return this.behaviorGuard.evaluate('action_blocked_or_failed', 'general')
        ?.messageTemplate.replace('{alternatives}', 'try rephrasing your request') 
        || 'I did not understand your request. Could you rephrase it?';
    }

    // Check if safety blocked
    const failedChecks = state.safetyChecks.filter(c => !c.passed);
    if (failedChecks.length > 0) {
      const primary = failedChecks[0];
      return `${primary.explanation}

${this.generateSafeAlternative(state, primary)}`;
    }

    // Build response based on intent
    const domain = intent.domain;
    const action = intent.action;
    const params = intent.parameters;

    // Apply behavior rules
    const behavior = this.behaviorGuard.evaluate('sensitive_action_requested', domain);
    if (behavior && this.behaviorGuard.requiresExplanation(action, domain)) {
      return this.behaviorGuard.formatMessage(behavior, { action, effect: this.describeEffect(action, params) });
    }

    // Standard response templates
    const templates: Record<string, string> = {
      book_ride: `I can help you book a ride${params.location ? ` from ${params.location}` : ''}${params.destination ? ` to ${params.destination}` : ''}. Confirm to proceed.`,
      send_payment: `You want to send ${params.amount || 'money'}${params.recipient ? ` to ${params.recipient}` : ''}. This requires your PIN confirmation.`,
      check_balance: `I can show your wallet balance. Here is what I found.`,
      schedule_appointment: `I can schedule a medical appointment${params.provider ? ` with ${params.provider}` : ''}${params.date ? ` on ${params.date}` : ''}.`,
      view_records: `Your health records are available. I can read them aloud or display them with your approval.`,
      redeem_points: `You want to redeem ${params.amount || 'points'}. This will convert your cash points.`,
      find_provider: `I found providers near you${params.specialization ? ` specializing in ${params.specialization}` : ''}.`,
      general_help: `I am here to help. What would you like to do?`,
      unknown: `I am not sure what you need. Could you tell me more?`,
    };

    return templates[action] || templates.unknown;
  }

  async generateExplanation(state: CognitiveState): Promise<string> {
    const parts: string[] = [];

    // Reasoning path
    if (state.decisionGraph?.explainability.length) {
      parts.push(`Reasoning: ${state.decisionGraph.explainability.join(' → ')}`);
    }

    // Intent confidence
    if (state.intent) {
      parts.push(`Intent confidence: ${state.intent.confidence} (${state.intent.ambiguityScore < 0.3 ? 'clear' : 'ambiguous'})`);
    }

    // Tools selected
    if (state.selectedTools.filter(t => t.selected).length > 0) {
      parts.push(`Tools: ${state.selectedTools.filter(t => t.selected).map(t => t.name).join(', ')}`);
    }

    // Agents triggered
    if (state.agentRoutes.length > 0) {
      parts.push(`Agents: ${state.agentRoutes.map(r => r.name).join(', ')}`);
    }

    // Safety status
    const allSafe = state.safetyChecks.every(c => c.passed);
    parts.push(`Safety: ${allSafe ? 'All checks passed' : 'Some checks failed — see response for details'}`);

    return parts.join('. ');
  }

  async calculateConfidence(state: CognitiveState): Promise<number> {
    let score = 0;

    // Perception confidence (25%)
    const perceptionScore = state.perception?.confidence === 'certain' ? 1.0
      : state.perception?.confidence === 'high' ? 0.8
      : state.perception?.confidence === 'medium' ? 0.5
      : state.perception?.confidence === 'low' ? 0.3 : 0.1;
    score += perceptionScore * 0.25;

    // Intent confidence (25%)
    const intentScore = state.intent?.confidence === 'certain' ? 1.0
      : state.intent?.confidence === 'high' ? 0.8
      : state.intent?.confidence === 'medium' ? 0.5
      : state.intent?.confidence === 'low' ? 0.3 : 0.1;
    score += intentScore * 0.25;

    // Safety score (25%)
    const safetyScore = state.safetyChecks.every(c => c.passed) ? 1.0
      : state.safetyChecks.filter(c => c.passed).length / state.safetyChecks.length;
    score += safetyScore * 0.25;

    // Memory relevance (15%)
    const memoryScore = state.memory.length > 0
      ? state.memory.reduce((s, m) => s + m.relevanceScore, 0) / state.memory.length
      : 0.5;
    score += memoryScore * 0.15;

    // Tool match (10%)
    const toolScore = state.selectedTools.filter(t => t.selected).length > 0 ? 0.8 : 0.2;
    score += toolScore * 0.10;

    return Math.max(0, Math.min(1, score));
  }

  private generateSuggestedActions(state: CognitiveState): string[] {
    const actions: string[] = [];
    const intent = state.intent?.primaryIntent;

    if (!intent) return ['Try rephrasing your request', 'Ask for general help'];

    if (intent.domain === 'health') {
      actions.push('View health records');
      actions.push('Schedule appointment');
      actions.push('Find nearby provider');
    }
    if (intent.domain === 'wallet') {
      actions.push('Check balance');
      actions.push('View transactions');
    }
    if (intent.domain === 'transport') {
      actions.push('Book a ride');
      actions.push('Check ride status');
    }

    if (state.intent?.requiresConfirmation) {
      actions.push('Confirm and proceed');
      actions.push('Cancel and rethink');
    }

    return actions;
  }

  private generateFallback(state: CognitiveState): string | undefined {
    if (state.intent?.confidence === 'low' || state.intent?.confidence === 'unknown') {
      return 'Would you like me to show you what I can help with?';
    }
    if (state.safetyChecks.some(c => !c.passed)) {
      return 'I can help you with a different approach. What else would you like to do?';
    }
    return undefined;
  }

  private generateSafeAlternative(state: CognitiveState, check: any): string {
    if (check.alternativePath === 'request_explicit_consent') {
      return 'I can request your approval. Would you like me to do that?';
    }
    if (check.alternativePath === 'escalate_kyc') {
      return 'You may need to complete identity verification first. I can guide you through that.';
    }
    return 'Let me know if you would like to try a different approach.';
  }

  private describeEffect(action: string, params: Record<string, any>): string {
    const effects: Record<string, string> = {
      book_ride: 'request a vehicle to your location',
      send_payment: `transfer ${params.amount || 'funds'} to another user`,
      check_balance: 'display your current wallet balance',
      schedule_appointment: 'book a medical consultation',
      view_records: 'access your private health data',
      redeem_points: 'convert your earned points',
    };
    return effects[action] || 'perform this action';
  }

  private mapConfidenceLevel(score: number): ConfidenceLevel {
    if (score > 0.9) return 'certain';
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    if (score > 0.2) return 'low';
    return 'unknown';
  }
}
