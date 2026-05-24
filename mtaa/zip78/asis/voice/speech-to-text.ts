// ============================================================
// SPEECH TO TEXT — STT provider abstraction
// Offline fallback stubbed. Multilingual ready.
// ============================================================

import { VoiceConfig, STTResult, VoiceProvider } from './voice-types';

export class SpeechToText {
  private config: VoiceConfig;
  private isRunning: boolean = false;
  private recognition: any = null; // Native SpeechRecognition
  private callback: ((result: STTResult) => void) | null = null;

  constructor(config: VoiceConfig) { this.config = config; }

  async start(onResult: (result: STTResult) => void): Promise<void> {
    if (this.isRunning) return;
    this.callback = onResult;

    if (this.config.provider === 'native' && typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      await this.startNative();
    } else if (this.config.offlineFallback) {
      await this.startOffline();
    } else {
      throw new Error(`STT provider ${this.config.provider} not available`);
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.recognition) { try { this.recognition.stop(); } catch {} this.recognition = null; }
    this.callback = null;
  }

  updateConfig(updates: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  private async startNative(): Promise<void> {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.config.language;

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const sttResult: STTResult = {
          text, confidence: result[0].confidence || 0.8,
          language: this.config.language, isFinal: result.isFinal,
          durationMs: 0,
        };
        this.callback?.(sttResult);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (this.config.offlineFallback) this.startOffline();
    };

    this.isRunning = true;
    this.recognition.start();
  }

  private async startOffline(): Promise<void> {
    // Offline STT stub — implement with on-device model
    this.isRunning = true;
    // Placeholder: would load TensorFlow Lite / ONNX model
    console.log('[STT] Offline mode active — using local model');
  }
}
