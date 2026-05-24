// ============================================================
// AVATAR GENERATOR — Text-to-avatar description system
// Stub only. No external dependency required yet.
// ============================================================

import { AvatarDescription, AvatarMode, AvatarExpression } from './avatar-types';

export class AvatarGenerator {
  private descriptions: Map<string, AvatarDescription> = new Map();

  generateFromText(text: string, mode: AvatarMode = 'friendly'): AvatarDescription {
    // Simple keyword-based expression mapping
    let expression: AvatarExpression = 'neutral';
    const lower = text.toLowerCase();

    if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('danger')) expression = 'alert';
    else if (lower.includes('congratulations') || lower.includes('success') || lower.includes('great job')) expression = 'celebratory';
    else if (lower.includes('warning') || lower.includes('caution') || lower.includes('careful')) expression = 'warning';
    else if (lower.includes('help') || lower.includes('how can i') || lower.includes('assist')) expression = 'helpful';
    else if (lower.includes('relax') || lower.includes('calm') || lower.includes('rest')) expression = 'calm';

    const description: AvatarDescription = {
      text,
      mode,
      expression,
      culturalContext: this.detectCulturalContext(text),
    };

    this.descriptions.set(`desc_${Date.now()}`, description);
    return description;
  }

  generateFromIntent(intent: string, entities: Record<string, string>, mode: AvatarMode): AvatarDescription {
    const text = this.buildTextFromIntent(intent, entities);
    return this.generateFromText(text, mode);
  }

  private detectCulturalContext(text: string): string | undefined {
    const patterns: Record<string, string[]> = {
      'west_african': ['nigeria', 'ghana', 'lagos', 'accra', 'yoruba', 'twi', 'hausa'],
      'east_african': ['kenya', 'tanzania', 'nairobi', 'dar es salaam', 'swahili', 'kikuyu'],
      'southern_african': ['south africa', 'zimbabwe', 'zambia', 'johannesburg', 'shona', 'zulu'],
      'north_african': ['egypt', 'morocco', 'cairo', 'casablanca', 'arabic', 'berber'],
    };

    const lower = text.toLowerCase();
    for (const [context, keywords] of Object.entries(patterns)) {
      if (keywords.some(k => lower.includes(k))) return context;
    }
    return undefined;
  }

  private buildTextFromIntent(intent: string, entities: Record<string, string>): string {
    const parts = [intent];
    for (const [key, value] of Object.entries(entities)) {
      parts.push(`${key}: ${value}`);
    }
    return parts.join(', ');
  }
}
