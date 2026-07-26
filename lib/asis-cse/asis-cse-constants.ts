/**
 * ASIS CSE — Constants & Calibration
 * KAMOS Theory: 1⊗1 = 1 ⊕ f(growth, replication, interaction, observation)
 */

// ============================================================================
// KAMOS Mathematical Constants
// ============================================================================

/** Golden ratio conjugate — the self-limiting coupling constant */
export const KAMOS_COUPLING = 0.618033988749895 as const;

/** Context decay rate per cycle */
export const CONTEXT_DECAY = 0.1 as const;

/** Identity persistence factor — how much self-model survives per cycle */
export const IDENTITY_PERSISTENCE = 0.95 as const;

/** Observation amplification threshold — minimum signal to register */
export const OBSERVATION_THRESHOLD = 0.01 as const;

/** Maximum emergence value — prevents runaway growth */
export const MAX_EMERGENCE = 2.618033988749895 as const; // φ²

/** Minimum entity value — prevents collapse to zero */
export const MIN_ENTITY_VALUE = 0.001 as const;

/** KAMOS identity element for addition */
export const KAMOS_ZERO = 0 as const;

/** KAMOS identity element for multiplication (base unit) */
export const KAMOS_ONE = 1 as const;

// ============================================================================
// Engine Timing & Performance
// ============================================================================

/** Default engine timeout in milliseconds */
export const ENGINE_TIMEOUT_MS = 5000 as const;

/** Cognitive cycle interval in milliseconds */
export const CYCLE_INTERVAL_MS = 100 as const;

/** Maximum engines that can run concurrently */
export const MAX_CONCURRENT_ENGINES = 8 as const;

/** Memory cleanup interval in milliseconds */
export const MEMORY_CLEANUP_INTERVAL_MS = 30000 as const;

/** Engine health check interval in milliseconds */
export const ENGINE_HEALTH_CHECK_MS = 10000 as const;

// ============================================================================
// Memory Tier Limits
// ============================================================================

/** Sensory memory TTL — milliseconds before automatic eviction */
export const SENSORY_TTL_MS = 5000 as const;

/** Working memory max items */
export const WORKING_MAX_ITEMS = 7 as const;

/** Episodic memory max items */
export const EPISODIC_MAX_ITEMS = 1000 as const;

/** Semantic memory max items */
export const SEMANTIC_MAX_ITEMS = 10000 as const;

/** Procedural memory max items */
export const PROCEDURAL_MAX_ITEMS = 5000 as const;

/** Strategic memory max items */
export const STRATEGIC_MAX_ITEMS = 500 as const;

/** Collective memory sync interval */
export const COLLECTIVE_SYNC_INTERVAL_MS = 60000 as const;

// ============================================================================
// Confidence & Trust Thresholds
// ============================================================================

/** Minimum confidence for memory promotion to next tier */
export const MEMORY_PROMOTION_THRESHOLD = 0.7 as const;

/** Minimum confidence for evidence to become knowledge */
export const KNOWLEDGE_CONFIDENCE_THRESHOLD = 0.8 as const;

/** Minimum trust score for autonomous action */
export const AUTONOMY_TRUST_THRESHOLD = 0.85 as const;

/** Default trust score for new entities */
export const DEFAULT_TRUST_SCORE = 0.5 as const;

/** Trust decay rate per interaction */
export const TRUST_DECAY_RATE = 0.02 as const;

/** Maximum trust score */
export const MAX_TRUST_SCORE = 1.0 as const;

/** Minimum trust score before quarantine */
export const MIN_TRUST_SCORE = 0.1 as const;

// ============================================================================
// Attention & Salience
// ============================================================================

/** Default attention allocation */
export const DEFAULT_ATTENTION = 0.1 as const;

/** Maximum attention any single input can receive */
export const MAX_ATTENTION = 1.0 as const;

/** Attention decay per cycle */
export const ATTENTION_DECAY = 0.05 as const;

/** Novelty bonus for salience calculation */
export const NOVELTY_BONUS = 0.3 as const;

// ============================================================================
// API & Plugin Limits
// ============================================================================

/** Default API port */
export const API_PORT = 7331 as const;

/** Maximum request payload size in bytes */
export const MAX_REQUEST_SIZE = 1048576 as const; // 1MB

/** Default API request timeout */
export const API_TIMEOUT_MS = 10000 as const;

/** Maximum plugins loaded simultaneously */
export const MAX_PLUGINS = 32 as const;

/** Plugin sandbox memory limit in MB */
export const PLUGIN_MEMORY_MB = 128 as const;

/** Plugin execution timeout */
export const PLUGIN_TIMEOUT_MS = 30000 as const;

// ============================================================================
// Error & Recovery
// ============================================================================

/** Maximum consecutive errors before engine quarantine */
export const MAX_CONSECUTIVE_ERRORS = 5 as const;

/** Engine restart cooldown in milliseconds */
export const ENGINE_RESTART_COOLDOWN_MS = 5000 as const;

/** Circuit breaker threshold */
export const CIRCUIT_BREAKER_THRESHOLD = 10 as const;

/** Circuit breaker recovery timeout */
export const CIRCUIT_BREAKER_RECOVERY_MS = 30000 as const;
