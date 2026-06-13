/**
 * IntentClassifier
 * Maps user input to intents using rule-based + embedding approaches
 * Lightweight, fast, zero external dependencies in Layer 3
 */

import { IntentClassification, Entity } from '../types';

export class IntentClassifier {
  private _intentPatterns: Map<string, RegExp[]> = new Map();
  private _entityPatterns: Map<string, RegExp> = new Map();

  constructor() {
    this._initPatterns();
  }

  private _initPatterns(): void {
    // Wallet intents
    this._intentPatterns.set('wallet', [
      /\b(send|transfer|pay|payment|wallet|balance|money|deposit|withdraw|claim)\b/i,
      /\b(ksh|kes|usd|ugx|tzs|ngn)\b/i,
      /\b(mpesa|airtel money|bank)\b/i,
    ]);

    // Transport intents
    this._intentPatterns.set('transport', [
      /\b(taxi|ride|transport|mtaxi|mtruck|truck|delivery|driver|pickup|drop)\b/i,
      /\b(book|get|call).{0,10}(ride|taxi|truck)\b/i,
      /\b(nearby|closest).{0,10}(driver|taxi)\b/i,
    ]);

    // Jobs intents
    this._intentPatterns.set('jobs', [
      /\b(job|work|hire|salary|employment|cv|resume|career|position|opening)\b/i,
      /\b(apply|post|search).{0,10}(job|work)\b/i,
      /\b(looking for|need).{0,10}(job|work|employee)\b/i,
    ]);

    // Health intents
    this._intentPatterns.set('health', [
      /\b(health|doctor|hospital|clinic|appointment|symptom|medicine|prescription)\b/i,
      /\b(feel sick|not feeling well|pain|fever|headache)\b/i,
      /\b(book|see|visit).{0,10}(doctor|specialist)\b/i,
    ]);

    // Civic intents
    this._intentPatterns.set('civic', [
      /\b(police|court|permit|license|government|civic|report|complaint)\b/i,
      /\b(apply for|get|renew).{0,10}(permit|license|id)\b/i,
    ]);

    // Engineering intents
    this._intentPatterns.set('engineering', [
      /\b(plan|design|simulate|build|construct|infrastructure|project)\b/i,
      /\b(estimate|cost|budget).{0,10}(project|build)\b/i,
    ]);

    // Help intents
    this._intentPatterns.set('help', [
      /\b(help|how|what|faq|support|assist|guide)\b/i,
      /\b(what can you do|how does this work|explain)\b/i,
    ]);

    // Entity patterns
    this._entityPatterns.set('amount', /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(ksh|kes|usd|ugx|tzs)?\b/gi);
    this._entityPatterns.set('phone', /\b(\+?\d{10,13})\b/g);
    this._entityPatterns.set('location', /\b(to|from|in|at|near)\s+([A-Za-z\s]+?)(?:\s|$)/gi);
    this._entityPatterns.set('date', /\b(today|tomorrow|next\s+\w+|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/gi);
    this._entityPatterns.set('time', /\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/gi);
  }

  classify(input: string): IntentClassification {
    const lowerInput = input.toLowerCase();
    let bestIntent = 'general';
    let bestScore = 0;
    const matchedEntities: Entity[] = [];

    // Score each intent
    for (const [intent, patterns] of this._intentPatterns) {
      let score = 0;
      let matches = 0;

      for (const pattern of patterns) {
        const patternMatches = lowerInput.match(pattern);
        if (patternMatches) {
          matches += patternMatches.length;
          score += patternMatches.length * 0.3;
        }
      }

      // Boost for exact keyword matches
      const keywords = this._getIntentKeywords(intent);
      for (const kw of keywords) {
        if (lowerInput.includes(kw)) {
          score += 0.5;
          matches++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    // Extract entities
    for (const [entityType, pattern] of this._entityPatterns) {
      const matches = input.matchAll(pattern);
      for (const match of matches) {
        matchedEntities.push({
          type: entityType,
          value: match[0].trim(),
          start: match.index || 0,
          end: (match.index || 0) + match[0].length,
          confidence: 0.8,
        });
      }
    }

    // Determine if confirmation is needed
    const requiresConfirmation = this._requiresConfirmation(bestIntent, matchedEntities);

    // Generate suggested actions
    const suggestedActions = this._generateSuggestedActions(bestIntent, matchedEntities);

    return {
      intent: bestIntent,
      confidence: Math.min(bestScore, 1.0),
      agent: `${bestIntent}_agent`,
      entities: matchedEntities,
      requiresConfirmation,
      suggestedActions,
    };
  }

  private _getIntentKeywords(intent: string): string[] {
    const keywords: Record<string, string[]> = {
      wallet: ['send', 'pay', 'balance', 'money', 'transfer'],
      transport: ['taxi', 'ride', 'truck', 'book', 'driver'],
      jobs: ['job', 'work', 'hire', 'apply', 'cv'],
      health: ['doctor', 'hospital', 'appointment', 'symptom'],
      civic: ['police', 'court', 'permit', 'license'],
      engineering: ['plan', 'design', 'simulate', 'build'],
      help: ['help', 'how', 'what', 'faq'],
    };
    return keywords[intent] || [];
  }

  private _requiresConfirmation(intent: string, entities: Entity[]): boolean {
    if (intent === 'wallet') {
      const hasAmount = entities.some((e) => e.type === 'amount');
      return hasAmount;
    }
    if (intent === 'health') {
      const hasSymptom = entities.some((e) => e.type === 'symptom');
      return hasSymptom;
    }
    return false;
  }

  private _generateSuggestedActions(intent: string, entities: Entity[]): string[] {
    const actions: Record<string, string[]> = {
      wallet: ['Check balance', 'Send money', 'View transactions'],
      transport: ['Book taxi', 'Track ride', 'Estimate fare'],
      jobs: ['Search jobs', 'Update CV', 'View applications'],
      health: ['Book appointment', 'Find doctor', 'Symptom check'],
      civic: ['Apply for permit', 'File report', 'Check status'],
      engineering: ['Start planning', 'Run simulation', 'Cost estimate'],
      help: ['What can you do?', 'How to send money', 'How to book ride'],
    };
    return actions[intent] || ['Help me'];
  }
}
