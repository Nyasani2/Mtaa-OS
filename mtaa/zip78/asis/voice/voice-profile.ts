// ============================================================
// VOICE PROFILE — User voice preferences
// Tone, speed, clarity, accent settings
// ============================================================

import { VoiceConfig, VoiceGender, VoiceSpeed, VoiceTone } from './voice-types';

export interface UserVoicePreferences {
  userId: string;
  preferredLanguage: string;
  fallbackLanguages: string[];
  gender: VoiceGender;
  speed: VoiceSpeed;
  tone: VoiceTone;
  pitch: number;
  volume: number;
  autoSpeak: boolean;
  hapticFeedback: boolean;
  subtitleEnabled: boolean;
}

export class VoiceProfile {
  private prefs: UserVoicePreferences;
  private config: VoiceConfig;

  constructor(config: VoiceConfig) {
    this.config = config;
    this.prefs = {
      userId: '', preferredLanguage: config.language, fallbackLanguages: ['en'],
      gender: config.gender, speed: config.speed, tone: config.tone,
      pitch: config.pitch, volume: config.volume,
      autoSpeak: true, hapticFeedback: true, subtitleEnabled: true,
    };
  }

  setPreferences(prefs: Partial<UserVoicePreferences>): void {
    this.prefs = { ...this.prefs, ...prefs };
    this.syncToConfig();
  }

  getPreferences(): UserVoicePreferences { return { ...this.prefs }; }

  update(configUpdates: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...configUpdates };
    this.prefs = { ...this.prefs, preferredLanguage: this.config.language, gender: this.config.gender, speed: this.config.speed, tone: this.config.tone, pitch: this.config.pitch, volume: this.config.volume };
  }

  addFallbackLanguage(lang: string): void {
    if (!this.prefs.fallbackLanguages.includes(lang)) {
      this.prefs.fallbackLanguages.push(lang);
    }
  }

  removeFallbackLanguage(lang: string): void {
    this.prefs.fallbackLanguages = this.prefs.fallbackLanguages.filter(l => l !== lang);
  }

  private syncToConfig(): void {
    this.config = { ...this.config, language: this.prefs.preferredLanguage, gender: this.prefs.gender, speed: this.prefs.speed, tone: this.prefs.tone, pitch: this.prefs.pitch, volume: this.prefs.volume };
  }
}
