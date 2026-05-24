# ZIP 9 — ASIS Cognitive Core (Brain System)

## What This Is

The **decision-making brain architecture** of ASIS. Pure cognition layer.

**NOT** a feature module. **NOT** UI. **NOT** another agent.

This defines:
- How ASIS thinks
- How ASIS decides
- How ASIS chooses tools
- How ASIS routes agents
- How ASIS uses memory
- How ASIS maintains context continuity

## Pipeline

```
INPUT → PERCEPTION → CONTEXT BUILD → INTENT ANALYSIS → MEMORY INJECTION →
DECISION GRAPH → TOOL SELECTION → AGENT ROUTING → SAFETY CHECK → RESPONSE PLAN → OUTPUT
```

## Files

| File | Purpose |
|------|---------|
| `cognitive-engine.ts` | Central orchestrator. Async, interruptible, fallback paths |
| `perception-layer.ts` | Input normalization, entity extraction, domain/urgency/ambiguity detection |
| `context-builder.ts` | Unified context from session + memory + state. Token-budget aware |
| `intent-resolution.ts` | Intent classification, multi-intent detection, ambiguity scoring |
| `memory-injection.ts` | Relevant memory slices only. No full dump. Privacy + consent filtered |
| `decision-graph.ts` | Branching reasoning structure. Weighted paths. Explainability output |
| `tool-selection-engine.ts` | Tool selection by intent match, safety, KYC, success rate, latency |
| `agent-routing-engine.ts` | Agent selection, coordination, conflict resolution, fallback |
| `safety-checkpoint.ts` | Consent, security, risk, domain restriction validation before ANY action |
| `response-planner.ts` | Structured response: answer + explanation + confidence + actions |
| `rules/reasoning-rules.ts` | Safety > speed > convenience. Minimal tools. Explain before act |
| `rules/prioritization-rules.ts` | Urgent health > wallet > transport > general |
| `rules/conflict-resolution.ts` | Multi-agent contradiction resolution |
| `types.ts` | Complete type system for cognition |
| `interfaces.ts` | Service contracts |

## Core Principles

1. **Reason before responding** — Every output goes through the full pipeline
2. **Validate before acting** — Safety checkpoint gates ALL execution
3. **Explain decisions** — Every response includes reasoning path
4. **Safe fallback over risky execution** — Blocked = explained alternative
5. **Avoid hallucinated tool usage** — Tools validated against registry
6. **Minimize unnecessary computation** — Short-circuit on low confidence

## Usage

```typescript
import { CognitiveEngine, PerceptionLayer, ContextBuilder, IntentResolution, MemoryInjection, DecisionGraphEngine, ToolSelectionEngine, AgentRoutingEngine, SafetyCheckpoint, ResponsePlanner } from './asis/core/cognition';
import { ASISConsentManager } from './asis/core/consent';
import { ASISBehaviorGuard } from './asis/core/behavior';

const engine = new CognitiveEngine({
  perception: new PerceptionLayer(),
  contextBuilder: new ContextBuilder(),
  intentResolver: new IntentResolution(),
  memoryInjector: new MemoryInjection(),
  decisionGraph: new DecisionGraphEngine(),
  toolSelector: new ToolSelectionEngine(),
  agentRouter: new AgentRoutingEngine(),
  safetyCheckpoint: new SafetyCheckpoint(new ASISConsentManager(), new ASISBehaviorGuard()),
  responsePlanner: new ResponsePlanner(new ASISBehaviorGuard()),
});

const output = await engine.process({
  id: 'input_1',
  type: 'text',
  payload: 'Book a ride to the hospital and check my wallet balance',
  timestamp: new Date().toISOString(),
  sessionId: 'sess_123',
  userId: 'user_456',
});

console.log(output.response);
console.log(output.reasoningPath);
console.log(output.confidence);
```

## Output Format

Every cognitive output includes:
- `response` — Final answer to user
- `reasoningPath` — Array of reasoning steps
- `confidence` — certain / high / medium / low / unknown
- `confidenceScore` — 0-1 numeric
- `toolsUsed` — Tool IDs invoked
- `agentsTriggered` — Agent IDs activated
- `safetyPassed` — Boolean
- `executionPath` — direct / clarification / navigator / delegated / blocked / fallback
- `processingTimeMs` — Performance metric

## Cross-ZIP Integration

| ZIP | System | Integration Point |
|-----|--------|-------------------|
| 4 | Memory | MemoryInjection loads from ZIP 4 memory system |
| 5 | Wallet | ToolSelection routes to wallet tools |
| 6 | Cash | ToolSelection routes to cash tools |
| 7 | Health | SafetyCheckpoint enforces health consent |
| 8 | Voice | ResponsePlanner outputs to voice engine |
| Hardening | Consent/Behavior | SafetyCheckpoint uses unified consent + behavior guard |
