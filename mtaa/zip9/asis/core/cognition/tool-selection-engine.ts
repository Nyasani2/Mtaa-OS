// ============================================================
// TOOL SELECTION — Intent match, safety, KYC, success rate, latency
// Avoid overuse. Avoid redundancy.
// ============================================================

import { IToolSelection } from './interfaces';
import { ResolvedIntent, UnifiedContext, ToolCandidate } from './types';

export class ToolSelectionEngine implements IToolSelection {
  private toolRegistry: Map<string, ToolCandidate> = new Map();
  private usageHistory: Map<string, { success: number; failure: number; avgLatency: number }> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  async select(intent: ResolvedIntent, context: UnifiedContext, safetyLevel: string): Promise<ToolCandidate[]> {
    const candidates: ToolCandidate[] = [];

    for (const [_, tool] of this.toolRegistry) {
      if (tool.domain !== intent.primaryIntent.domain && tool.domain !== 'general') continue;

      const intentMatch = this.calculateIntentMatch(tool, intent);
      const safetyOk = this.checkSafety(tool, safetyLevel);
      const kycOk = this.checkKyc(tool, context);
      const history = this.usageHistory.get(tool.toolId);
      const successRate = history ? history.success / (history.success + history.failure) : 0.8;

      if (safetyOk && kycOk) {
        const score = this.score(tool, intent, context);
        candidates.push({
          ...tool,
          intentMatch,
          historicalSuccessRate: successRate,
          score,
          selected: false,
        });
      }
    }

    // Sort by score, select top 3
    candidates.sort((a, b) => b.score - a.score);
    const selected = candidates.slice(0, 3);
    selected.forEach(s => s.selected = true);

    return [...selected, ...candidates.slice(3)];
  }

  score(tool: ToolCandidate, intent: ResolvedIntent, context: UnifiedContext): number {
    let score = 0;

    // Intent match (40%)
    score += tool.intentMatch * 0.4;

    // Safety alignment (20%)
    score += (tool.safetyLevel === 'safe' ? 1 : tool.safetyLevel === 'caution' ? 0.5 : 0) * 0.2;

    // Historical success (20%)
    score += tool.historicalSuccessRate * 0.2;

    // Latency preference (10%) — prefer faster tools
    const latencyScore = Math.max(0, 1 - tool.estimatedLatencyMs / 5000);
    score += latencyScore * 0.1;

    // Domain relevance (10%)
    score += (tool.domain === intent.primaryIntent.domain ? 1 : 0.3) * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  avoidRedundancy(tools: ToolCandidate[]): ToolCandidate[] {
    const seenDomains = new Set<string>();
    const result: ToolCandidate[] = [];

    for (const tool of tools) {
      // Skip if we already have a tool for this exact purpose
      const purposeKey = `${tool.domain}_${tool.name}`;
      if (seenDomains.has(purposeKey) && tool.selected) {
        tool.selected = false;
      }
      if (tool.selected) seenDomains.add(purposeKey);
      result.push(tool);
    }

    return result;
  }

  recordUsage(toolId: string, success: boolean, latencyMs: number): void {
    const existing = this.usageHistory.get(toolId) || { success: 0, failure: 0, avgLatency: 0 };
    if (success) existing.success++;
    else existing.failure++;
    existing.avgLatency = (existing.avgLatency * (existing.success + existing.failure - 1) + latencyMs) / (existing.success + existing.failure);
    this.usageHistory.set(toolId, existing);
  }

  private calculateIntentMatch(tool: ToolCandidate, intent: ResolvedIntent): number {
    const intentName = intent.primaryIntent.name.toLowerCase();
    const toolName = tool.name.toLowerCase();

    if (toolName.includes(intentName) || intentName.includes(toolName)) return 0.95;
    if (tool.domain === intent.primaryIntent.domain) return 0.6;
    return 0.2;
  }

  private checkSafety(tool: ToolCandidate, safetyLevel: string): boolean {
    if (safetyLevel === 'danger') return tool.safetyLevel === 'safe';
    if (safetyLevel === 'caution') return tool.safetyLevel !== 'danger';
    return true;
  }

  private checkKyc(tool: ToolCandidate, context: UnifiedContext): boolean {
    const kycSignal = context.userProfileSignals.find(s => s.type === 'kyc_level');
    const userKyc = kycSignal?.value || 0;
    return userKyc >= tool.minKycLevel;
  }

  private registerDefaultTools(): void {
    const defaults: Omit<ToolCandidate, 'intentMatch' | 'historicalSuccessRate' | 'score' | 'selected'>[] = [
      { toolId: 'tool_wallet_send', name: 'send_payment', domain: 'wallet', safetyLevel: 'caution', minKycLevel: 1, estimatedLatencyMs: 2000 },
      { toolId: 'tool_wallet_balance', name: 'check_balance', domain: 'wallet', safetyLevel: 'safe', minKycLevel: 0, estimatedLatencyMs: 500 },
      { toolId: 'tool_health_records', name: 'view_records', domain: 'health', safetyLevel: 'caution', minKycLevel: 1, estimatedLatencyMs: 1500 },
      { toolId: 'tool_health_appointment', name: 'schedule_appointment', domain: 'health', safetyLevel: 'safe', minKycLevel: 0, estimatedLatencyMs: 3000 },
      { toolId: 'tool_transport_book', name: 'book_ride', domain: 'transport', safetyLevel: 'safe', minKycLevel: 0, estimatedLatencyMs: 2500 },
      { toolId: 'tool_cash_redeem', name: 'redeem_points', domain: 'cash', safetyLevel: 'caution', minKycLevel: 1, estimatedLatencyMs: 2000 },
      { toolId: 'tool_general_navigate', name: 'navigate', domain: 'general', safetyLevel: 'safe', minKycLevel: 0, estimatedLatencyMs: 300 },
    ];

    defaults.forEach(t => this.toolRegistry.set(t.toolId, { ...t, intentMatch: 0, historicalSuccessRate: 0.8, score: 0, selected: false }));
  }
}
