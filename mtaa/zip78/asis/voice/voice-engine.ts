// ============================================================
// VOICE ENGINE — Abstraction layer for STT + TTS
// Offline fallback ready. Multilingual ready.
// ============================================================

import { SpeechToText } from './speech-to-text';
import { TextToSpeech } from './text-to-speech';
import { VoiceProfile } from './voice-profile';
import { VoiceConfig, STTResult, TTSRequest, TTSResult, VoiceSession, VoiceMessage, AvatarExpression } from './voice-types';

export class VoiceEngine {
  private stt: SpeechToText;
  private tts: TextToSpeech;
  private profile: VoiceProfile;
  private config: VoiceConfig;
  private sessions: Map<string, VoiceSession> = new Map();
  private isListening: boolean = false;

  constructor(config: VoiceConfig) {
    this.config = config;
    this.profile = new VoiceProfile(config);
    this.stt = new SpeechToText(config);
    this.tts = new TextToSpeech(config);
  }

  async startSession(userId: string, mode: VoiceSession['mode'] = 'voice_avatar'): Promise<VoiceSession> {
    const session: VoiceSession = {
      id: `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId, startedAt: new Date().toISOString(), mode,
      language: this.config.language, messages: [],
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async endSession(sessionId: string): Promise<VoiceSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    const ended = { ...session, endedAt: new Date().toISOString() };
    this.sessions.set(sessionId, ended);
    this.isListening = false;
    return ended;
  }

  async listen(sessionId: string, onResult?: (result: STTResult) => void): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;

    await this.stt.start(async (result) => {
      if (result.isFinal) {
        const session = this.sessions.get(sessionId);
        if (session) {
          const message: VoiceMessage = {
            id: `vm_${Date.now()}`, role: 'user', text: result.text,
            timestamp: new Date().toISOString(),
          };
          session.messages.push(message);
        }
      }
      onResult?.(result);
    });
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    await this.stt.stop();
  }

  async speak(sessionId: string, text: string, expression?: AvatarExpression): Promise<TTSResult> {
    const request: TTSRequest = { text, language: this.config.language, speed: this.config.speed, tone: this.config.tone };
    const result = await this.tts.synthesize(request);

    const session = this.sessions.get(sessionId);
    if (session) {
      const message: VoiceMessage = {
        id: `vm_${Date.now()}`, role: 'asis', text,
        audioUrl: result.audioUrl, timestamp: new Date().toISOString(),
        avatarExpression: expression || 'helpful',
      };
      session.messages.push(message);
    }
    return result;
  }

  async speakResponse(sessionId: string, userText: string, responseText: string): Promise<TTSResult> {
    // Determine expression based on response content
    let expression: AvatarExpression = 'helpful';
    if (responseText.includes('warning') || responseText.includes('alert') || responseText.includes('caution')) expression = 'warning';
    else if (responseText.includes('congratulations') || responseText.includes('great') || responseText.includes('success')) expression = 'celebratory';
    else if (responseText.includes('emergency') || responseText.includes('urgent')) expression = 'alert';

    return this.speak(sessionId, responseText, expression);
  }

  getSession(sessionId: string): VoiceSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateConfig(updates: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.profile.update(updates);
    this.stt.updateConfig(updates);
    this.tts.updateConfig(updates);
  }

  getConfig(): VoiceConfig { return { ...this.config }; }
  isActive(): boolean { return this.isListening; }
}
