// ============================================================
// PERSONALITY PRESETS — Pre-configured avatar personalities
// professional | friendly | minimal | cultural
// ============================================================

import { PersonalityPreset, AvatarMode } from './avatar-types';

export const PRESETS: PersonalityPreset[] = [
  {
    id: 'preset_professional',
    name: 'Professional',
    mode: 'professional',
    defaultExpression: 'neutral',
    greetingStyle: 'Good day. How may I assist you today?',
    responseStyle: 'Formal, concise, structured',
    emojiSet: ['✅', '📋', '⏱️', '📊', '🔍'],
    colorScheme: { primary: '#1E3A5F', secondary: '#4A90A4', accent: '#FFD700' },
  },
  {
    id: 'preset_friendly',
    name: 'Friendly',
    mode: 'friendly',
    defaultExpression: 'calm',
    greetingStyle: 'Hey there! Ready to help you out!',
    responseStyle: 'Warm, conversational, encouraging',
    emojiSet: ['👋', '💡', '🌟', '🙌', '✨'],
    colorScheme: { primary: '#3B82F6', secondary: '#60A5FA', accent: '#FBBF24' },
  },
  {
    id: 'preset_minimal',
    name: 'Minimal',
    mode: 'minimal',
    defaultExpression: 'neutral',
    greetingStyle: 'Hello.',
    responseStyle: 'Brief, direct, no fluff',
    emojiSet: ['·', '→', '✓', '—', '◆'],
    colorScheme: { primary: '#374151', secondary: '#6B7280', accent: '#D1D5DB' },
  },
  {
    id: 'preset_cultural_wa',
    name: 'West African',
    mode: 'cultural',
    defaultExpression: 'calm',
    greetingStyle: 'Welcome! How body? I dey here to help you.',
    responseStyle: 'Warm, respectful, community-oriented',
    emojiSet: ['🌍', '🤝', '🌴', '👐', '💚'],
    colorScheme: { primary: '#047857', secondary: '#10B981', accent: '#F59E0B' },
  },
  {
    id: 'preset_cultural_ea',
    name: 'East African',
    mode: 'cultural',
    defaultExpression: 'calm',
    greetingStyle: 'Habari! Karibu, I am here to assist you.',
    responseStyle: 'Hospitable, patient, community-minded',
    emojiSet: ['🦁', '🌅', '🏔️', '🤲', '❤️'],
    colorScheme: { primary: '#B45309', secondary: '#D97706', accent: '#10B981' },
  },
  {
    id: 'preset_cultural_sa',
    name: 'Southern African',
    mode: 'cultural',
    defaultExpression: 'calm',
    greetingStyle: 'Sawubona! I am here to help.',
    responseStyle: 'Respectful, warm, ubuntu-spirited',
    emojiSet: ['🌄', '🦓', '🌺', '🙏', '💙'],
    colorScheme: { primary: '#4338CA', secondary: '#6366F1', accent: '#EC4899' },
  },
];

export class PersonalityPresets {
  private presets: Map<string, PersonalityPreset> = new Map();

  constructor() {
    PRESETS.forEach(p => this.presets.set(p.id, p));
  }

  getPreset(mode: AvatarMode): PersonalityPreset | undefined {
    return Array.from(this.presets.values()).find(p => p.mode === mode);
  }

  getById(id: string): PersonalityPreset | undefined {
    return this.presets.get(id);
  }

  getAllPresets(): PersonalityPreset[] {
    return Array.from(this.presets.values());
  }

  getCulturalPresets(): PersonalityPreset[] {
    return this.getAllPresets().filter(p => p.mode === 'cultural');
  }

  addPreset(preset: PersonalityPreset): void {
    this.presets.set(preset.id, preset);
  }
}
