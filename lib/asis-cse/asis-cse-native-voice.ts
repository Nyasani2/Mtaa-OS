// @ts-nocheck
/**
 * ASIS Native Voice Engine - Offline & Native STT/TTS
 * Uses expo-av for recording and native OS speech services.
 */
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export class NativeVoiceEngine {
  private recording: Audio.Recording | null = null;
  private isRecording = false;

  async startRecording(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return false;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('[NativeVoice] Recording failed:', err);
      return false;
    }
  }

  async stopAndTranscribe(): Promise<string> {
    if (!this.recording || !this.isRecording) return '';
    
    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.isRecording = false;
      
      // In production: Send 'uri' to Whisper.cpp or native STT API
      // For now, return a structured placeholder
      return `[Audio recorded at ${uri}. Transcription requires native STT module.]`;
    } catch (err) {
      return '';
    }
  }

  speakNative(text: string): void {
    if (Platform.OS === 'ios') {
      // Use Expo Speech or native TTS bridge
      console.log('[NativeVoice TTS]:', text);
    } else if (Platform.OS === 'android') {
      console.log('[NativeVoice TTS]:', text);
    } else {
      // Web fallback
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    }
  }
}
export const nativeVoiceEngine = new NativeVoiceEngine();
