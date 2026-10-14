/**
 * ASIS CSE — Voice Engine (Speech-to-Text & Text-to-Speech)
 * Handles voice input transcription and voice output synthesis.
 */

export interface VoiceTranscriptionResult {
  text: string;
  isFinal: boolean;
}

export class VoiceEngine {
  private recognition: any;
  private isListening = false;

  constructor() {
    // Initialize Web Speech API for browsers/Expo Web
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false; // Stop after one sentence
        this.recognition.interimResults = true; // Show results as you speak
        this.recognition.lang = 'en-US';
      }
    }
  }

  /**
   * Start listening and transcribing speech.
   * @param onResult Callback for transcription results (interim and final).
   * @param onEnd Callback when listening stops.
   */
  startListening(
    onResult: (result: VoiceTranscriptionResult) => void,
    onEnd: () => void
  ): void {
    if (!this.recognition) {
      console.warn('[VoiceEngine] Speech recognition not supported in this environment.');
      // Fallback for native mobile: In a real app, you'd use @react-native-voice/voice here.
      onResult({ text: '[Native STT not implemented yet. Please use web or type.]', isFinal: true });
      onEnd();
      return;
    }

    if (this.isListening) return;
    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult({ text: finalTranscript, isFinal: true });
      } else if (interimTranscript) {
        onResult({ text: interimTranscript, isFinal: false });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('[VoiceEngine] Speech recognition error:', event.error);
      this.isListening = false;
      onEnd();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      console.log('[VoiceEngine] Listening started...');
    } catch (err) {
      console.error('[VoiceEngine] Failed to start recognition:', err);
      this.isListening = false;
      onEnd();
    }
  }

  /**
   * Stop listening.
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      console.log('[VoiceEngine] Listening stopped.');
    }
  }

  /**
   * Check if currently listening.
   */
  getIsListening(): boolean {
    return this.isListening;
  }
}

// Singleton instance
export const voiceEngine = new VoiceEngine();
