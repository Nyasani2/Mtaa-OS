// ============================================================
// VOICE TYPES — Shared voice/avatar type definitions
// ============================================================

export type VoiceProvider = 'native' | 'google' | 'azure' | 'aws' | 'offline';
export type VoiceGender = 'neutral' | 'male' | 'female';
export type VoiceSpeed = 'slow' | 'normal' | 'fast';
export type VoiceTone = 'calm' | 'professional' | 'friendly' | 'assertive';

export interface VoiceConfig {
  provider: VoiceProvider;
  language: string;
  gender: VoiceGender;
  speed: VoiceSpeed;
  tone: VoiceTone;
  pitch: number; // 0.5 - 2.0
  volume: number; // 0.0 - 1.0
  offlineFallback: boolean;
}

export interface STTResult {
  text: string;
  confidence: number;
  language: string;
  isFinal: boolean;
  durationMs: number;
}

export interface TTSRequest {
  text: string;
  language?: string;
  speed?: VoiceSpeed;
  tone?: VoiceTone;
  priority?: 'normal' | 'urgent' | 'background';
}

export interface TTSResult {
  audioUrl?: string;
  audioBase64?: string;
  durationMs: number;
  language: string;
  cached: boolean;
}

export type AvatarMode = 'professional' | 'friendly' | 'minimal' | 'cultural';
export type AvatarExpression = 'calm' | 'alert' | 'helpful' | 'warning' | 'celebratory' | 'neutral';
export type AvatarSize = 'micro' | 'small' | 'medium' | 'large';

export interface AvatarConfig {
  mode: AvatarMode;
  size: AvatarSize;
  primaryColor: string;
  secondaryColor: string;
  animationEnabled: boolean;
  soundEnabled: boolean;
  culturalPreset?: string; // e.g., 'west_african', 'east_african', 'southern_african'
}

export interface AvatarState {
  expression: AvatarExpression;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  activityLabel?: string;
}

export interface VoiceSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  mode: 'voice_only' | 'voice_avatar' | 'avatar_only';
  language: string;
  messages: VoiceMessage[];
}

export interface VoiceMessage {
  id: string;
  role: 'user' | 'asis' | 'system';
  text: string;
  audioUrl?: string;
  timestamp: string;
  avatarExpression?: AvatarExpression;
}
