// ============================================================
// INTENT RESOLUTION — Classify, multi-intent detect, ambiguity score
// Fallback suggestions, confidence scoring
// ============================================================

import { IIntentResolution } from './interfaces';
import { PerceptionState, UnifiedContext, ResolvedIntent, Intent, ConfidenceLevel, Domain } from './types';

export class IntentResolution implements IIntentResolution {
  private intentPatterns: Array<{ name: string; domain: Domain; patterns: RegExp[]; parameters: string[] }> = [
    { name: 'book_ride', domain: 'transport', patterns: [/book.*ride/, /get.*taxi/, /call.*mtaxi/, /need.*pickup/], parameters: ['location', 'destination', 'time'] },
    { name: 'send_payment', domain: 'wallet', patterns: [/send.*money/, /pay.*someone/, /transfer.*to/, /send.*payment/], parameters: ['amount', 'recipient', 'method'] },
    { name: 'check_balance', domain: 'wallet', patterns: [/check.*balance/, /how much.*have/, /wallet.*balance/, /my.*balance/], parameters: ['currency'] },
    { name: 'schedule_appointment', domain: 'health', patterns: [/book.*appointment/, /schedule.*doctor/, /see.*physician/, /medical.*appointment/], parameters: ['provider', 'date', 'time', 'type'] },
    { name: 'view_records', domain: 'health', patterns: [/view.*records/, /my.*health.*data/, /medical.*history/, /prescriptions/], parameters: ['category', 'date_range'] },
    { name: 'redeem_points', domain: 'cash', patterns: [/redeem.*points/, /cash.*out/, /convert.*points/, /use.*points/], parameters: ['amount', 'method'] },
    { name: 'find_provider', domain: 'health', patterns: [/find.*hospital/, /nearby.*clinic/, /doctor.*near/, /pharmacy.*close/], parameters: ['location', 'specialization'] },
    { name: 'general_help', domain: 'general', patterns: [/help/, /what.*can.*do/, /how.*work/, /assist/], parameters: ['topic'] },
  ];

  async resolve(perception: PerceptionState, context: UnifiedContext): Promise<ResolvedIntent> {
    const text = perception.normalizedText;
    const detectedIntents = this.matchIntents(text);

    // Sort by confidence
    detectedIntents.sort((a, b) => b.confidence - a.confidence);

    const primary = detectedIntents[0] || this.createFallbackIntent(text);
    const secondary = detectedIntents.slice(1, 3); // top 2 secondary

    const ambiguity = await this.scoreAmbiguity(detectedIntents);
    const clarifications = await this.suggestClarifications(ambiguity, detectedIntents);
    const requiresConfirmation = ambiguity > 0.5 || primary.domain === 'wallet' || primary.domain === 'health';

    return {
      id: `intent_${Date.now()}`,
      primaryIntent: primary,
      secondaryIntents: secondary,
      confidence: this.mapConfidence(primary.confidence),
      ambiguityScore: ambiguity,
      suggestedClarifications: clarifications,
      requiresConfirmation,
    };
  }

  async detectMultiIntent(text: string): Promise<string[]> {
    const intents = this.matchIntents(text);
    // Check for chaining indicators
    const chainWords = ['and then', 'after that', 'also', 'plus', 'and'];
    const hasChain = chainWords.some(w => text.includes(w));

    if (hasChain && intents.length > 1) {
      return intents.map(i => i.name);
    }
    return intents.length > 0 ? [intents[0].name] : ['general_help'];
  }

  async scoreAmbiguity(intents: Intent[]): Promise<number> {
    if (intents.length === 0) return 1.0;
    if (intents.length === 1 && intents[0].confidence > 0.8) return 0.1;

    // High ambiguity if multiple intents with similar confidence
    if (intents.length >= 2) {
      const gap = intents[0].confidence - intents[1].confidence;
      if (gap < 0.2) return 0.7; // Very close scores = ambiguous
      if (gap < 0.4) return 0.4;
    }
    return 0.2;
  }

  async suggestClarifications(ambiguityScore: number, intents: Intent[]): Promise<string[]> {
    if (ambiguityScore < 0.3) return [];

    const suggestions: string[] = [];
    if (intents.length >= 2) {
      suggestions.push(`Did you mean: ${intents[0].name} or ${intents[1].name}?`);
    }
    if (ambiguityScore > 0.6) {
      suggestions.push('Could you provide more details about what you need?');
    }
    if (intents.some(i => i.domain === 'wallet' || i.domain === 'health')) {
      suggestions.push('This involves sensitive data. I will need your confirmation before proceeding.');
    }
    return suggestions;
  }

  private matchIntents(text: string): Intent[] {
    const matches: Intent[] = [];
    for (const pattern of this.intentPatterns) {
      let matchCount = 0;
      for (const regex of pattern.patterns) {
        if (regex.test(text)) matchCount++;
      }
      if (matchCount > 0) {
        const confidence = Math.min(1, matchCount / pattern.patterns.length + 0.3);
        matches.push({
          name: pattern.name,
          domain: pattern.domain,
          action: pattern.name,
          parameters: this.extractParameters(text, pattern.parameters),
          confidence,
        });
      }
    }
    return matches;
  }

  private extractParameters(text: string, paramNames: string[]): Record<string, any> {
    const params: Record<string, any> = {};
    // Amount extraction
    if (paramNames.includes('amount')) {
      const amountMatch = text.match(/\b\d+(?:\.\d{2})?\b/);
      if (amountMatch) params.amount = parseFloat(amountMatch[0]);
    }
    // Date extraction
    if (paramNames.includes('date')) {
      const dateMatch = text.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/);
      if (dateMatch) params.date = dateMatch[0];
    }
    // Location extraction (simple)
    if (paramNames.includes('location')) {
      const locKeywords = ['from', 'at', 'in', 'near'];
      for (const kw of locKeywords) {
        const idx = text.indexOf(kw);
        if (idx !== -1) {
          const after = text.substring(idx + kw.length).trim().split(/[,.\s]/)[0];
          if (after && after.length > 2) { params.location = after; break; }
        }
      }
    }
    return params;
  }

  private createFallbackIntent(text: string): Intent {
    return {
      name: 'unknown',
      domain: 'general',
      action: 'navigate',
      parameters: { query: text },
      confidence: 0.1,
    };
  }

  private mapConfidence(score: number): ConfidenceLevel {
    if (score > 0.9) return 'certain';
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    if (score > 0.2) return 'low';
    return 'unknown';
  }
}
