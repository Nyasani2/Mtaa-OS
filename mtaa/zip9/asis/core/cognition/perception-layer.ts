// ============================================================
// PERCEPTION LAYER — Input normalization + entity extraction
// Detects domain, urgency, ambiguity, sentiment
// ============================================================

import { IPerceptionLayer } from './interfaces';
import { RawInput, PerceptionState, ExtractedEntity, Domain, UrgencyLevel, ConfidenceLevel } from './types';

export class PerceptionLayer implements IPerceptionLayer {
  private domainKeywords: Record<Domain, string[]> = {
    general: ['help', 'what', 'how', 'tell me', 'explain'],
    wallet: ['wallet', 'balance', 'send', 'receive', 'pay', 'payment', 'money', 'transfer', 'escrow'],
    health: ['health', 'doctor', 'hospital', 'prescription', 'medicine', 'appointment', 'symptom', 'medical'],
    transport: ['ride', 'taxi', 'truck', 'delivery', 'pickup', 'dropoff', 'mtaxi', 'mtruck'],
    cash: ['cash', 'points', 'redeem', 'convert', 'reward', 'earn'],
    civic: ['police', 'court', 'prison', 'government', 'permit', 'license', 'report'],
    education: ['learn', 'course', 'class', 'school', 'study', 'exam', 'certificate'],
    marketplace: ['buy', 'sell', 'product', 'shop', 'market', 'order', 'listing'],
    system: ['settings', 'profile', 'account', 'logout', 'login', 'password', 'security'],
  };

  private urgencyKeywords: Record<UrgencyLevel, string[]> = {
    critical: ['emergency', 'urgent', 'now', 'immediately', 'asap', 'critical', 'life threatening', 'dying'],
    high: ['quickly', 'soon', 'fast', 'hurry', 'important', 'deadline'],
    medium: ['today', 'this week', 'when possible', 'schedule'],
    low: ['later', 'sometime', 'eventually', 'whenever', 'no rush'],
    background: ['remind', 'notify', 'track', 'monitor'],
  };

  async process(input: RawInput): Promise<PerceptionState> {
    const text = this.normalize(input);
    const entities = await this.extractEntities(text);
    const domain = await this.detectDomain(text);
    const urgency = await this.detectUrgency(text);
    const ambiguity = await this.detectAmbiguity(text, entities);
    const sentiment = this.detectSentiment(text);
    const confidence = this.calculateConfidence(entities, ambiguity);

    return {
      inputId: input.id,
      normalizedText: text,
      entities,
      detectedDomain: domain as Domain,
      urgency,
      ambiguityScore: ambiguity,
      sentiment,
      language: input.metadata?.locale || 'en',
      confidence,
    };
  }

  async detectDomain(text: string): Promise<string> {
    const lower = text.toLowerCase();
    let bestDomain: Domain = 'general';
    let bestScore = 0;

    for (const [domain, keywords] of Object.entries(this.domainKeywords)) {
      const score = keywords.filter(k => lower.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain as Domain;
      }
    }
    return bestDomain;
  }

  async extractEntities(text: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    const lower = text.toLowerCase();

    // Amount detection
    const amountMatches = lower.match(/\b\d+(?:\.\d{2})?(?:\s?(?:usd|ngn|kes|ghs|zar|\$|₦|ksh|cedi|r))?\b/gi);
    amountMatches?.forEach(m => {
      entities.push({ type: 'amount', value: m, startIndex: lower.indexOf(m), endIndex: lower.indexOf(m) + m.length, confidence: 0.9 });
    });

    // Date detection
    const dateMatches = lower.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g);
    dateMatches?.forEach(m => {
      entities.push({ type: 'date', value: m, startIndex: lower.indexOf(m), endIndex: lower.indexOf(m) + m.length, confidence: 0.85 });
    });

    // Service detection
    const serviceKeywords = ['mtaxi', 'mtruck', 'appointment', 'delivery', 'ride', 'consultation'];
    serviceKeywords.forEach(kw => {
      const idx = lower.indexOf(kw);
      if (idx !== -1) entities.push({ type: 'service', value: kw, startIndex: idx, endIndex: idx + kw.length, confidence: 0.95 });
    });

    // Action detection
    const actionKeywords = ['book', 'send', 'pay', 'schedule', 'cancel', 'find', 'show', 'update', 'delete'];
    actionKeywords.forEach(kw => {
      const idx = lower.indexOf(kw);
      if (idx !== -1) entities.push({ type: 'action', value: kw, startIndex: idx, endIndex: idx + kw.length, confidence: 0.9 });
    });

    return entities;
  }

  async detectUrgency(text: string): Promise<UrgencyLevel> {
    const lower = text.toLowerCase();
    for (const [level, keywords] of Object.entries(this.urgencyKeywords)) {
      if (keywords.some(k => lower.includes(k))) return level as UrgencyLevel;
    }
    return 'low';
  }

  async detectAmbiguity(text: string, entities: ExtractedEntity[]): Promise<number> {
    // Higher score = more ambiguous
    let score = 0;
    if (entities.length < 2) score += 0.3;
    if (text.length < 10) score += 0.2;
    if (text.includes('or') || text.includes('?')) score += 0.2;
    const actionCount = entities.filter(e => e.type === 'action').length;
    if (actionCount > 1) score += 0.15;
    return Math.min(1, score);
  }

  private detectSentiment(text: string): PerceptionState['sentiment'] {
    const lower = text.toLowerCase();
    if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('help')) return 'urgent';
    if (lower.includes('thank') || lower.includes('great') || lower.includes('good')) return 'positive';
    if (lower.includes('bad') || lower.includes('wrong') || lower.includes('error') || lower.includes('frustrated')) return 'negative';
    return 'neutral';
  }

  private calculateConfidence(entities: ExtractedEntity[], ambiguity: number): ConfidenceLevel {
    const avgEntityConfidence = entities.length > 0
      ? entities.reduce((s, e) => s + e.confidence, 0) / entities.length
      : 0;
    const score = avgEntityConfidence * (1 - ambiguity);
    if (score > 0.9) return 'certain';
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    if (score > 0.2) return 'low';
    return 'unknown';
  }

  private normalize(input: RawInput): string {
    if (typeof input.payload === 'string') {
      return input.payload
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    }
    // Structured input — flatten to string
    return JSON.stringify(input.payload).toLowerCase();
  }
}
