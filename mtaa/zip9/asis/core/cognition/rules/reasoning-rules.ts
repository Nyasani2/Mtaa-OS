// ============================================================
// REASONING RULES — Core reasoning principles
// Safety > speed > convenience. Clarity over complexity.
// Minimal tool usage. Explain before acting.
// ============================================================

import { ToolCandidate } from '../types';

export class ReasoningRules {
  // Principle 1: Safety > Speed > Convenience
  prioritizeSafety(tools: ToolCandidate[]): ToolCandidate[] {
    return tools.sort((a, b) => {
      const safetyOrder = { safe: 3, caution: 2, danger: 1 };
      return safetyOrder[b.safetyLevel] - safetyOrder[a.safetyLevel];
    });
  }

  // Principle 2: Minimal tool usage — prefer fewer, more powerful tools
  applyMinimalToolPrinciple(tools: ToolCandidate[]): ToolCandidate[] {
    // If we have a general tool that covers the need, prefer it over domain-specific
    const hasGeneral = tools.some(t => t.domain === 'general' && t.selected);
    if (hasGeneral && tools.filter(t => t.selected).length > 2) {
      // Reduce to 2 tools max when general is available
      const selected = tools.filter(t => t.selected).slice(0, 2);
      tools.forEach(t => { if (!selected.includes(t)) t.selected = false; });
    }
    return tools;
  }

  // Principle 3: Clarity over complexity — prefer simple explanations
  simplifyExplanation(explanation: string): string {
    // Remove technical jargon for user-facing output
    return explanation
      .replace(/cognitive state/gi, 'my understanding')
      .replace(/intent resolution/gi, 'what I think you want')
      .replace(/decision graph/gi, 'my reasoning')
      .replace(/tool selection/gi, 'what I will use')
      .replace(/agent routing/gi, 'who will help');
  }

  // Principle 4: Explain before acting
  requiresExplanation(action: string, domain: string): boolean {
    const sensitiveActions = ['send', 'delete', 'transfer', 'share', 'override', 'purge'];
    return sensitiveActions.some(a => action.includes(a)) || ['wallet', 'health', 'cash'].includes(domain);
  }

  // Principle 5: Avoid hallucinated tool usage
  validateToolExists(toolId: string, registry: Set<string>): boolean {
    return registry.has(toolId);
  }

  // Principle 6: Minimize unnecessary computation
  shouldShortCircuit(state: { confidence: string; ambiguity: number }): boolean {
    // If confidence is very low and ambiguity high, skip complex reasoning
    return state.confidence === 'unknown' && state.ambiguity > 0.8;
  }
}
