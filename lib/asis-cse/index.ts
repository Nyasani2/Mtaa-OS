/**
 * ASIS CSE v2 — Barrel Export File
 * Central export point for all ASIS Cognitive System Engine modules.
 * Every module in lib/asis-cse/ is re-exported from here.
 * Self-contained. No external APIs.
 *
 * @module lib/asis-cse/index
 */

// ============================================================================
// CORE ENGINES
// ============================================================================

export * from './asis-cse-chat';
export * from './asis-cse-tool-code';
export * from './asis-cse-kernel';

// ============================================================================
// SERVICE LAYER
// ============================================================================

export * from '../services/asis-cse-service';

// ============================================================================
// V2 PIPELINE ENGINES (assumed present in engines/ subdirectory)
// ============================================================================

export { WebResearchEngine } from './engines/web-research';
export { ResponseEngineV2 } from './engines/response-engine-v2';
export { ReasoningEngineV2 } from './engines/reasoning-v2';
export { SynthesisEngineV2 } from './engines/synthesis-v2';
export { IdentityEngine } from './engines/identity-engine';
export { UnderstandingEngine } from './engines/understanding-engine';
export { ObservationEngine } from './engines/observation-engine';

// ============================================================================
// TYPES (re-export for convenience)
// ============================================================================

export type {
  AsisMessage,
  AsisSession,
  AsisMemory,
  ChatContext,
  MemoryEngineResult,
} from './asis-cse-chat';

export type {
  ToolParameter,
  ToolDefinition,
  ToolResult,
  ToolInvocation,
  ToolRouteResult,
} from './asis-cse-tool-code';

export type {
  IntentType,
  IntentClassification,
  EngineRegistryEntry,
  ConfidenceInput,
} from './asis-cse-kernel';

export type {
  AsisQueryRequest,
  AsisQueryResponse,
} from '../services/asis-cse-service';

// ============================================================================
// DEFAULT EXPORT — CognitiveKernel as primary entry point
// ============================================================================

export { default } from './asis-cse-kernel';
export { CognitiveKernel } from './asis-cse-kernel';
