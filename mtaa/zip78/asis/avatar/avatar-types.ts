// ============================================================
// AVATAR TYPES — Shared with voice module
// ============================================================

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
  culturalPreset?: string;
}

export interface AvatarState {
  expression: AvatarExpression;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  activityLabel?: string;
}

export interface AvatarDescription {
  text: string;
  mode: AvatarMode;
  expression: AvatarExpression;
  culturalContext?: string;
}

export interface PersonalityPreset {
  id: string;
  name: string;
  mode: AvatarMode;
  defaultExpression: AvatarExpression;
  greetingStyle: string;
  responseStyle: string;
  emojiSet: string[];
  colorScheme: { primary: string; secondary: string; accent: string };
}
