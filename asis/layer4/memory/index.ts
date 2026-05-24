/**
 * ASIS Layer 4 — Memory & Personalization
 * Barrel exports
 */

// Core engine
export { MemoryEngine, MemoryStore, MemoryPrivacyError } from './memory-engine';
export type { MemoryEngineConfig } from './memory-engine';

// Stores
export { ShortTermStore } from './stores/short-term-store';
export { LongTermStore } from './stores/long-term-store';
export { SemanticStore } from './stores/semantic-store';
export { PreferenceStore } from './stores/preference-store';
export { SecurityStore } from './stores/security-store';

// Providers
export { createEmbeddingProvider, IEmbeddingProvider } from './providers/embedding-provider';
export type { EmbeddingProviderConfig } from './providers/embedding-provider';
export { createLLMProvider, ILLMProvider } from './providers/llm-provider';
export type { LLMProviderConfig, LLMOptions } from './providers/llm-provider';
export { createVectorStoreProvider, IVectorStoreProvider } from './providers/vector-store-provider';
export type { VectorStoreConfig } from './providers/vector-store-provider';

// Privacy
export { PrivacyGate } from './privacy-gate';
export { DataExportEngine } from './data-export';
export { DataDeletionEngine } from './data-deletion';
export { ConsentManager } from './consent-manager';

// Context
export { ContextBuilder } from './context-builder';
export { ConversationHistory } from './conversation-history';
export { SemanticSearch } from './semantic-search';

// Learning
export { BehaviorEventSystem } from './behavior-events';
export { PreferenceEngine } from './preference-engine';
export type { ABTest, ABTestVariant } from './preference-engine';

// Safety
export { AgentGuard, AgentGuardError } from './agent-guard';
export type { AgentExecution, AgentGuardConfig } from './agent-guard';

// Indexing
export { MemoryIndexer } from './memory-indexer';

// Orchestrator
export { MemoryOrchestrator } from './memory-orchestrator';
export type { MemoryOrchestratorConfig } from './memory-orchestrator';

// Types (re-export from types/)
export * from '../types/memory.types';
export * from '../types/privacy.types';
export * from '../types/context.types';
