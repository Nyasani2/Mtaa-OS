/**
 * ASIS v4 Voice Engine
 * Web Speech API — speech recognition + synthesis, no cloud
 */

export interface VoiceConfig {
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
}

export class VoiceEngine {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private config: VoiceConfig = { lang: 'en-US', rate: 1.0, pitch: 1.0, volume: 1.0 };
  private isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        this.recognition = new SR();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
      }
      this.synthesis = window.speechSynthesis;
    }
  }

  isSupported(): boolean {
    return !!this.recognition && !!this.synthesis;
  }

  configure(config: Partial<VoiceConfig>) {
    this.config = { ...this.config, ...config };
    if (this.recognition) {
      this.recognition.lang = this.config.lang;
    }
  }

  startListening(
    onResult: (text: string) => void,
    onError: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError('Speech recognition not supported');
      return;
    }

    this.recognition.lang = this.config.lang;
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    this.recognition.onerror = (event: any) => {
      onError(event.error);
    };
    this.recognition.onend = () => {
      // Auto-restart if needed
    };
    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  speak(text: string): void {
    if (!this.synthesis) return;
    this.stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.config.lang;
    utterance.rate = this.config.rate;
    utterance.pitch = this.config.pitch;
    utterance.volume = this.config.volume;
    utterance.onstart = () => { this.isSpeaking = true; };
    utterance.onend = () => { this.isSpeaking = false; };
    this.synthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }
}

export const voiceEngine = new VoiceEngine();
