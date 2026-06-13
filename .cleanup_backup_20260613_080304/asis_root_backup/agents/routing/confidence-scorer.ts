/**
 * ConfidenceScorer
 * Evaluates routing confidence across multiple dimensions
 * Determines when to route, when to ask for clarification, when to fallback
 */

import { ConfidenceScore, IntentClassification } from '../types';

export class ConfidenceScorer {
  private _thresholds = {
    high: 0.8,
    medium: 0.5,
    low: 0.3,
  };

  score(classification: IntentClassification, context?: any): ConfidenceScore {
    const intentScore = classification.confidence;
    const entityScore = this._scoreEntities(classification.entities);
    const contextScore = this._scoreContext(classification.intent, context);

    // Weighted average
    const overall = (
      intentScore * 0.5 +
      entityScore * 0.3 +
      contextScore * 0.2
    );

    return {
      overall,
      intent: intentScore,
      entity: entityScore,
      context: contextScore,
      threshold: this._thresholds.medium,
      isConfident: overall >= this._thresholds.medium,
    };
  }

  private _scoreEntities(entities: any[]): number {
    if (entities.length === 0) return 0.3;
    if (entities.length >= 3) return 1.0;
    if (entities.length === 2) return 0.8;
    return 0.5;
  }

  private _scoreContext(intent: string, context?: any): number {
    if (!context) return 0.5;

    // Boost confidence if user has history with this intent
    const recentIntents = context.recentIntents || [];
    if (recentIntents.includes(intent)) {
      return 0.9;
    }

    // Boost if user is in related app section
    const currentRoute = context.currentRoute;
    if (currentRoute && currentRoute.includes(intent)) {
      return 0.85;
    }

    return 0.5;
  }

  shouldRoute(score: ConfidenceScore): boolean {
    return score.isConfident;
  }

  shouldClarify(score: ConfidenceScore): boolean {
    return score.overall >= this._thresholds.low && score.overall < this._thresholds.medium;
  }

  shouldFallback(score: ConfidenceScore): boolean {
    return score.overall < this._thresholds.low;
  }

  getConfidenceLevel(score: ConfidenceScore): 'high' | 'medium' | 'low' {
    if (score.overall >= this._thresholds.high) return 'high';
    if (score.overall >= this._thresholds.medium) return 'medium';
    return 'low';
  }
}
