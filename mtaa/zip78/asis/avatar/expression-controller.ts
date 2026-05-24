// ============================================================
// EXPRESSION CONTROLLER — Emotional state mapping
// calm | alert | helpful | warning | celebratory
// ============================================================

import { AvatarExpression } from './avatar-types';

export class ExpressionController {
  // Valid transitions matrix
  private transitions: Map<AvatarExpression, AvatarExpression[]> = new Map([
    ['neutral', ['calm', 'alert', 'helpful', 'warning', 'celebratory']],
    ['calm', ['neutral', 'helpful', 'alert']],
    ['alert', ['neutral', 'helpful', 'warning']],
    ['helpful', ['neutral', 'calm', 'celebratory']],
    ['warning', ['neutral', 'alert']],
    ['celebratory', ['neutral', 'helpful', 'calm']],
  ]);

  validateTransition(from: AvatarExpression, to: AvatarExpression): boolean {
    if (from === to) return true;
    const valid = this.transitions.get(from) || [];
    return valid.includes(to);
  }

  getRecommendedExpression(context: { urgency?: number; success?: boolean; userMood?: string }): AvatarExpression {
    if (context.urgency && context.urgency > 0.7) return 'alert';
    if (context.success === true) return 'celebratory';
    if (context.success === false) return 'warning';
    if (context.userMood === 'frustrated' || context.userMood === 'confused') return 'helpful';
    return 'calm';
  }

  getExpressionMetadata(expression: AvatarExpression): {
    color: string;
    animation: string;
    soundHint?: string;
    priority: number;
  } {
    const meta: Record<AvatarExpression, { color: string; animation: string; soundHint?: string; priority: number }> = {
      neutral: { color: '#6B7280', animation: 'idle', priority: 0 },
      calm: { color: '#10B981', animation: 'breathe', priority: 1 },
      alert: { color: '#EF4444', animation: 'pulse', soundHint: 'alert_chime', priority: 5 },
      helpful: { color: '#3B82F6', animation: 'wave', priority: 2 },
      warning: { color: '#F59E0B', animation: 'shake', soundHint: 'warning_beep', priority: 4 },
      celebratory: { color: '#8B5CF6', animation: 'bounce', soundHint: 'success_chime', priority: 3 },
    };
    return meta[expression];
  }

  // For health context — always calm and respectful
  getHealthExpression(severity: 'low' | 'medium' | 'high' | 'critical'): AvatarExpression {
    switch (severity) {
      case 'critical': return 'alert';
      case 'high': return 'warning';
      case 'medium': return 'helpful';
      case 'low': return 'calm';
    }
  }
}
