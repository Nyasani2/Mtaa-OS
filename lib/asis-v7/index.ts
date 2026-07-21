/**
 * ASIS v7 — Self-Contained Intelligence Engine
 * Main export file
 * No API dependency. Internet is the data center.
 * Kamos Theory: 1×1 = 1 + f(growth, replication, interaction, observation)
 */

// Types
export * from './types';

// Engines
export * from './engine';

// Store
export { KnowledgeStore, getKnowledgeStore } from './store/knowledge';

// Hooks
export { useASIS } from './hooks/useAsis';
