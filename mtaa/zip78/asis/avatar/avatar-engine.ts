// ============================================================
// AVATAR ENGINE — ASIS visual identity system
// Multiple modes: professional, friendly, minimal, cultural
// ============================================================

import { AvatarConfig, AvatarState, AvatarMode, AvatarExpression, AvatarSize } from './avatar-types';
import { ExpressionController } from './expression-controller';
import { PersonalityPresets } from './personality-presets';

export class AvatarEngine {
  private config: AvatarConfig;
  private state: AvatarState;
  private expressionController: ExpressionController;
  private personality: PersonalityPresets;
  private stateListeners: ((state: AvatarState) => void)[] = [];

  constructor(config: AvatarConfig) {
    this.config = config;
    this.expressionController = new ExpressionController();
    this.personality = new PersonalityPresets();
    this.state = {
      expression: 'neutral',
      isSpeaking: false,
      isListening: false,
      isThinking: false,
    };
  }

  setExpression(expression: AvatarExpression, reason?: string): void {
    const valid = this.expressionController.validateTransition(this.state.expression, expression);
    if (!valid) {
      console.warn(`[Avatar] Invalid expression transition: ${this.state.expression} -> ${expression}`);
      return;
    }
    this.state = { ...this.state, expression };
    this.notifyListeners();
  }

  setSpeaking(speaking: boolean): void {
    this.state = { ...this.state, isSpeaking: speaking, activityLabel: speaking ? 'Speaking...' : undefined };
    if (speaking) this.setExpression('helpful');
    this.notifyListeners();
  }

  setListening(listening: boolean): void {
    this.state = { ...this.state, isListening: listening, activityLabel: listening ? 'Listening...' : undefined };
    if (listening) this.setExpression('calm');
    this.notifyListeners();
  }

  setThinking(thinking: boolean): void {
    this.state = { ...this.state, isThinking: thinking, activityLabel: thinking ? 'Thinking...' : undefined };
    if (thinking) this.setExpression('alert');
    this.notifyListeners();
  }

  setMode(mode: AvatarMode): void {
    this.config = { ...this.config, mode };
    const preset = this.personality.getPreset(mode);
    if (preset) {
      this.config = { ...this.config, primaryColor: preset.colorScheme.primary, secondaryColor: preset.colorScheme.secondary };
    }
    this.notifyListeners();
  }

  setSize(size: AvatarSize): void {
    this.config = { ...this.config, size };
    this.notifyListeners();
  }

  updateConfig(updates: Partial<AvatarConfig>): void {
    this.config = { ...this.config, ...updates };
    this.notifyListeners();
  }

  getState(): AvatarState { return { ...this.state }; }
  getConfig(): AvatarConfig { return { ...this.config }; }

  onStateChange(listener: (state: AvatarState) => void): () => void {
    this.stateListeners.push(listener);
    return () => { this.stateListeners = this.stateListeners.filter(l => l !== listener); };
  }

  private notifyListeners(): void {
    this.stateListeners.forEach(l => l({ ...this.state }));
  }

  // Render helpers for React Native
  getRenderProps(): { size: number; primaryColor: string; secondaryColor: string; expression: AvatarExpression; animationEnabled: boolean } {
    const sizeMap: Record<AvatarSize, number> = { micro: 24, small: 40, medium: 64, large: 96 };
    return {
      size: sizeMap[this.config.size],
      primaryColor: this.config.primaryColor,
      secondaryColor: this.config.secondaryColor,
      expression: this.state.expression,
      animationEnabled: this.config.animationEnabled,
    };
  }
}
