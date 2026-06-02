/**
 * FallbackRouter
 * Handles ambiguous, low-confidence, or unrecognized requests
 * Routes to Navigator or asks for clarification
 */

import { IntentClassification, RoutingDecision } from '../types';
import { ConfidenceScore } from '../types';

export class FallbackRouter {
  private _navigatorAgent: string = 'navigator_agent';
  private _fallbackStrategies: Map<string, string[]> = new Map();

  constructor() {
    this._initFallbackStrategies();
  }

  private _initFallbackStrategies(): void {
    // When wallet is ambiguous, try these alternatives
    this._fallbackStrategies.set('wallet', ['navigator_agent', 'jobs_agent']);
    this._fallbackStrategies.set('transport', ['navigator_agent', 'wallet_agent']);
    this._fallbackStrategies.set('jobs', ['navigator_agent', 'wallet_agent']);
    this._fallbackStrategies.set('health', ['navigator_agent', 'transport_agent']);
    this._fallbackStrategies.set('civic', ['navigator_agent', 'health_agent']);
    this._fallbackStrategies.set('engineering', ['navigator_agent', 'transport_agent']);
  }

  route(
    classification: IntentClassification,
    score: ConfidenceScore,
    availableAgents: string[]
  ): RoutingDecision {
    // High confidence — direct route
    if (score.isConfident) {
      return {
        targetAgent: classification.agent,
        confidence: score.overall,
        intent: classification,
        fallbackAgents: this._getFallbackAgents(classification.intent, availableAgents),
        reasoning: `High confidence (${score.overall.toFixed(2)}) for intent "${classification.intent}"`,
      };
    }

    // Medium confidence — route with clarification
    if (score.overall >= 0.3) {
      return {
        targetAgent: classification.agent,
        confidence: score.overall,
        intent: classification,
        fallbackAgents: [this._navigatorAgent, ...this._getFallbackAgents(classification.intent, availableAgents)],
        reasoning: `Medium confidence (${score.overall.toFixed(2)}), may need clarification`,
      };
    }

    // Low confidence — route to navigator
    return {
      targetAgent: this._navigatorAgent,
      confidence: score.overall,
      intent: classification,
      fallbackAgents: availableAgents.filter((a) => a !== this._navigatorAgent).slice(0, 2),
      reasoning: `Low confidence (${score.overall.toFixed(2)}), falling back to navigator`,
    };
  }

  private _getFallbackAgents(intent: string, availableAgents: string[]): string[] {
    const strategies = this._fallbackStrategies.get(intent) || ['navigator_agent'];
    return strategies.filter((agent) => availableAgents.includes(agent));
  }

  generateClarification(classification: IntentClassification): string {
    const options = classification.suggestedActions.slice(0, 3);

    return `I am not entirely sure what you need. Did you mean:\n\n` +
      options.map((opt, i) => `${i + 1}. ${opt}`).join('\n') +
      `\n\nOr tell me more about what you are looking for.`;
  }
}
