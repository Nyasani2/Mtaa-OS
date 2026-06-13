# ASIS Layer 4 — Memory & Personalization

## Architecture

This layer provides the memory and personalization subsystem for ASIS, implementing all 17 system-wide quality rules.

## Components

| Component | Files | Purpose |
|-----------|-------|---------|
| **Memory Engine** | `memory-engine.ts` | Unified interface for 5 memory layers |
| **Stores** | `stores/*.ts` | 5 separate stores (composition, not inheritance) |
| **Providers** | `providers/*.ts` | Provider-agnostic abstractions |
| **Privacy** | `privacy-gate.ts`, `data-export.ts`, `data-deletion.ts`, `consent-manager.ts` | User-owned data controls |
| **Context** | `context-builder.ts`, `conversation-history.ts`, `semantic-search.ts` | Context enrichment |
| **Learning** | `behavior-events.ts`, `preference-engine.ts` | Event-driven learning |
| **Safety** | `agent-guard.ts`, `memory-orchestrator.ts` | Orchestrator safeguards |

## Memory Layers

1. **ShortTerm** — Session data, 1-hour TTL, aggressive eviction
2. **LongTerm** — Persistent facts, IndexedDB backing, offline-first
3. **Semantic** — Vector embeddings, semantic search
4. **Preference** — User choices, Bayesian confidence scoring
5. **Security** — Audit logs, 90-day retention, immutable

## Quality Rules Applied

| Rule | Implementation |
|------|---------------|
| 1. Lightweight | Composition over inheritance, small focused classes |
| 2. Agent Safety | `AgentGuard` with depth/parallel/timeout/retries |
| 3. Context Boundaries | `ContextScope` system, agents only get allowed slices |
| 4. Tool Modes | All tools support `execute()`, `dryRun()`, `validate()` |
| 5. Intent Classifier | `IIntentClassifier` interface ready |
| 6. Layered Memory | 5 separate stores, not merged |
| 7. Event Learning | `BehaviorEventSystem` from wallet/ride/actions |
| 8. Explainability | Recommendations include reasoning |
| 9. Provider Abstraction | No hardcoded OpenAI/Pinecone |
| 10. Security | Confirmation gates, audit logs, policy validation |
| 11. Performance | Low-memory Android optimization, small caches |
| 12. Offline-First | Local fallback embeddings, IndexedDB, queued actions |
| 13. Health Safety | Disclaimer system in context builder |
| 14. Engineering Safety | Scope restrictions on engineering agent |
| 15. UX Philosophy | Calm, contextual, progressive disclosure |
| 16. African-First | Mobile-first, low-end devices, intermittent connectivity |
| 17. Architecture | Operating intelligence layer, not just chatbot |

## Usage

```typescript
import { MemoryOrchestrator } from './memory';

const memory = new MemoryOrchestrator(userId, {
  embedding: { provider: 'openai', apiKey: '...' },
  vectorStore: { provider: 'pinecone', apiKey: '...' },
}, eventBus);

// Store a memory
await memory.store(MemoryLayer.LONG_TERM, 'favorite_driver', 'John', {
  scope: ContextScope.TRANSPORT,
  tags: ['driver', 'preference'],
});

// Build context
const context = await memory.buildContext(sessionId, 'Book a ride', [ContextScope.TRANSPORT]);

// Semantic search
const results = await memory.semanticQuery('cheap ride to town', ContextScope.TRANSPORT);
```
