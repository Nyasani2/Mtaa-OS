// Complete ASIS CSE barrel — exports all existing files in lib/asis-cse/
// NOTE: v2 pipeline files (response-engine-v2, web-research, reasoning-v2,
// synthesis-v2) are imported DIRECTLY by asis-cse-init.ts and the provider.
// Do NOT add them to this barrel to prevent circular dependencies.

export * from './asis-cse-types';
export * from './asis-cse-constants';

// ─── React safety re-export ─────────────────────────────────────────────────
export { createContext } from 'react';

// ─── Core Infrastructure ────────────────────────────────────────────────────
export * from './asis-cse-init';
export * from './asis-cse-api';
export * from './asis-cse-context';
export * from './asis-cse-kernel';
export * from './asis-cse-plugin';
export * from './asis-cse-react';
export * from './asis-cse-chat';

// ─── Event & Memory ─────────────────────────────────────────────────────────
export * from './asis-cse-event-system';
export * from './asis-cse-memory';

// ─── Utilities ──────────────────────────────────────────────────────────────
export * from './asis-cse-clock';
export * from './asis-cse-metrics-engine';

// ─── Cognitive Engines (22) ─────────────────────────────────────────────────
export * from './asis-cse-action-engine';
export * from './asis-cse-adaptation-engine';
export * from './asis-cse-attention-engine';
export * from './asis-cse-collective-engine';
export * from './asis-cse-decision-engine';
export * from './asis-cse-diagnostic-engine';
export * from './asis-cse-evidence-engine';
export * from './asis-cse-evolution-engine';
export * from './asis-cse-feedback-engine';
export * from './asis-cse-identity-engine';
export * from './asis-cse-knowledge-engine';
export * from './asis-cse-learning-engine';
export * from './asis-cse-observation-engine';
export * from './asis-cse-planning-engine';
export * from './asis-cse-purpose-engine';
export * from './asis-cse-reality-engine';
export * from './asis-cse-reasoning-engine';
export * from './asis-cse-reflection-engine';
export * from './asis-cse-security-engine';
export * from './asis-cse-simulation-engine';
export * from './asis-cse-understanding-engine';
export * from './asis-cse-wisdom-engine';

// ─── Kamos Theory ───────────────────────────────────────────────────────────
export * from './asis-cse-kamos';

// ─── Tools ──────────────────────────────────────────────────────────────────
export * from './asis-cse-tool-types';
export * from './asis-cse-tool-registry';
export * from './asis-cse-tool-code';
export * from './asis-cse-tool-browser';
export * from './asis-cse-tool-database';
export * from './asis-cse-tool-terminal';
