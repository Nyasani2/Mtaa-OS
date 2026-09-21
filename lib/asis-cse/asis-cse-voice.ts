// @ts-nocheck
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

export class VoiceEngine {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.error('Microphone permission not granted');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<{ uri: string } | null> {
    try {
      if (!this.recording) {
        console.error('No active recording');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;

      return uri ? { uri } : null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  async speak(text: string): Promise<void> {
    try {
      await Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onStart: () => console.log('ASIS speaking...'),
        onDone: () => console.log('ASIS finished speaking'),
        onError: (error) => console.error('Speech error:', error),
      });
    } catch (error) {
      console.error('Failed to speak:', error);
    }
  }

  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Failed to stop speaking:', error);
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}

export const voiceEngine = new VoiceEngine();
