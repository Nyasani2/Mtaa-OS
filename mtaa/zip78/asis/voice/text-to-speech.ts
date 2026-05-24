// ============================================================
// TEXT TO SPEECH — TTS provider abstraction
// Offline fallback stubbed. Multilingual ready.
// ============================================================

import { VoiceConfig, TTSRequest, TTSResult, VoiceProvider } from './voice-types';

export class TextToSpeech {
  private config: VoiceConfig;
  private cache: Map<string, TTSResult> = new Map();
  private audioContext: AudioContext | null = null;

  constructor(config: VoiceConfig) { this.config = config; }

  async synthesize(request: TTSRequest): Promise<TTSResult> {
    const cacheKey = `${request.text}_${request.language || this.config.language}_${request.speed || this.config.speed}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return { ...cached, cached: true };

    let result: TTSResult;
    if (this.config.provider === 'native' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      result = await this.synthesizeNative(request);
    } else if (this.config.offlineFallback) {
      result = await this.synthesizeOffline(request);
    } else {
      throw new Error(`TTS provider ${this.config.provider} not available`);
    }

    this.cache.set(cacheKey, result);
    return { ...result, cached: false };
  }

  async stop(): Promise<void> {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  updateConfig(updates: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  clearCache(): void { this.cache.clear(); }

  private async synthesizeNative(request: TTSRequest): Promise<TTSResult> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(request.text);
      utterance.lang = request.language || this.config.language;
      utterance.rate = this.speedToRate(request.speed || this.config.speed);
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;

      // Select voice by gender preference
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith(this.config.language) && this.voiceMatchesGender(v));
      if (preferred) utterance.voice = preferred;

      const startTime = Date.now();
      utterance.onend = () => {
        resolve({ durationMs: Date.now() - startTime, language: utterance.lang });
      };
      utterance.onerror = (e) => reject(e);
      window.speechSynthesis.speak(utterance);
    });
  }

  private async synthesizeOffline(request: TTSRequest): Promise<TTSResult> {
    // Offline TTS stub — implement with on-device model
    console.log('[TTS] Offline mode — synthesizing locally');
    return { durationMs: 0, language: this.config.language };
  }

  private speedToRate(speed: string): number {
    return { slow: 0.7, normal: 1.0, fast: 1.3 }[speed] || 1.0;
  }

  private voiceMatchesGender(voice: SpeechSynthesisVoice): boolean {
    if (this.config.gender === 'neutral') return true;
    const name = voice.name.toLowerCase();
    if (this.config.gender === 'female') return name.includes('female') || name.includes('woman') || name.includes('girl');
    if (this.config.gender === 'male') return name.includes('male') || name.includes('man') || name.includes('boy');
    return true;
  }
}
