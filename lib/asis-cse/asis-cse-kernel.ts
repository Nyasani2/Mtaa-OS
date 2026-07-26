/**
 * ASIS CSE — Cognitive Kernel & Executive Cortex
 * "Which engine should execute now?" — The conductor of cognition.
 * Orchestrates the 22-engine cycle, manages state, enforces KAMOS dynamics.
 */

import {
  CYCLE_INTERVAL_MS,
  MAX_CONCURRENT_ENGINES,
  ENGINE_TIMEOUT_MS,
  MAX_CONSECUTIVE_ERRORS,
  ENGINE_RESTART_COOLDOWN_MS,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_RECOVERY_MS,
} from './asis-cse-constants';

import type {
  EngineId,
  EngineConfig,
  EngineState,
  EngineProcess,
  CognitiveInput,
  CognitiveOutput,
  CyclePhase,
  CycleState,
  MemoryEnvelope,
} from './asis-cse-types';

import { globalMemoryStore, createMemory } from './asis-cse-memory';
import { decayContext, kamosMultiply, createEntity } from './asis-cse-kamos';

// ============================================================================
// Engine Registry
// ============================================================================

type EngineConstructor = new () => CognitiveEngine;

export interface CognitiveEngine {
  readonly id: EngineId;
  config: EngineConfig;
  state: EngineState;
  process(input: CognitiveInput): Promise<CognitiveOutput>;
  initialize?(): Promise<void>;
  shutdown?(): Promise<void>;
  onError?(error: Error): void;
}

export abstract class BaseEngine implements CognitiveEngine {
  abstract readonly id: EngineId;
  config: EngineConfig;
  state: EngineState;
  protected consecutiveErrors = 0;
  protected lastErrorTime = 0;
  protected circuitOpen = false;
  protected circuitOpenedAt = 0;

  constructor() {
    this.config = {
      id: this.id,
      enabled: true,
      priority: 50,
      timeoutMs: ENGINE_TIMEOUT_MS,
      maxMemoryFootprint: 100 * 1024 * 1024, // 100MB
      dependencies: [],
    };
    this.state = {
      id: this.id,
      status: 'idle',
      lastRun: 0,
      runCount: 0,
      errorCount: 0,
      averageLatencyMs: 0,
    };
  }

  abstract process(input: CognitiveInput): Promise<CognitiveOutput>;

  async run(input: CognitiveInput): Promise<CognitiveOutput | null> {
    // Circuit breaker check
    if (this.circuitOpen) {
      if (Date.now() - this.circuitOpenedAt > CIRCUIT_BREAKER_RECOVERY_MS) {
        this.circuitOpen = false;
        this.consecutiveErrors = 0;
      } else {
        return null;
      }
    }

    this.state.status = 'running';
    const startTime = Date.now();

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Engine ${this.id} timeout`)),
          this.config.timeoutMs
        );
      });

      const output = await Promise.race([this.process(input), timeoutPromise]);

      const latency = Date.now() - startTime;
      this.state.lastRun = Date.now();
      this.state.runCount++;
      this.state.averageLatencyMs =
        (this.state.averageLatencyMs * (this.state.runCount - 1) + latency) /
        this.state.runCount;
      this.state.status = 'idle';
      this.consecutiveErrors = 0;

      return output;
    } catch (error) {
      this.state.errorCount++;
      this.consecutiveErrors++;
      this.lastErrorTime = Date.now();
      this.state.status = 'error';

      if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        this.state.status = 'paused';
      }

      if (this.consecutiveErrors >= CIRCUIT_BREAKER_THRESHOLD) {
        this.circuitOpen = true;
        this.circuitOpenedAt = Date.now();
      }

      this.onError?.(error as Error);
      return null;
    }
  }

  onError?(error: Error): void {
    console.error(`[ASIS Engine ${this.id}]`, error.message);
  }
}

// ============================================================================
// Kernel
// ============================================================================

export class CognitiveKernel {
  private engines: Map<EngineId, CognitiveEngine>;
  private engineConstructors: Map<EngineId, EngineConstructor>;
  private cycleState: CycleState;
  private running = false;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private inputQueue: CognitiveInput[] = [];
  private outputBuffer: Map<string, CognitiveOutput> = new Map();

  constructor() {
    this.engines = new Map();
    this.engineConstructors = new Map();
    this.cycleState = {
      phase: 'reality',
      iteration: 0,
      startTime: Date.now(),
      inputs: [],
      outputs: new Map(),
      workingMemory: [],
      isComplete: false,
    };
  }

  /**
   * Registers an engine class with the kernel.
   */
  register(engineId: EngineId, constructor: EngineConstructor): void {
    this.engineConstructors.set(engineId, constructor);
  }

  /**
   * Initializes all registered engines.
   */
  async initialize(): Promise<void> {
    for (const [id, Constructor] of this.engineConstructors) {
      const engine = new Constructor();
      this.engines.set(id, engine);

      if (engine.initialize) {
        await engine.initialize();
      }
    }

    console.log(`[ASIS Kernel] ${this.engines.size} engines initialized`);
  }

  /**
   * Starts the cognitive cycle.
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    this.cycleTimer = setInterval(() => {
      this.tick();
    }, CYCLE_INTERVAL_MS);

    console.log('[ASIS Kernel] Cognitive cycle started');
  }

  /**
   * Stops the cognitive cycle.
   */
  async stop(): Promise<void> {
    this.running = false;
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }

    for (const engine of this.engines.values()) {
      if (engine.shutdown) {
        await engine.shutdown();
      }
    }

    console.log('[ASIS Kernel] Cognitive cycle stopped');
  }

  /**
   * Injects input into the cognitive cycle.
   */
  inject(input: CognitiveInput): void {
    this.inputQueue.push(input);
  }

  /**
   * Retrieves output by ID.
   */
  retrieveOutput(outputId: string): CognitiveOutput | undefined {
    return this.outputBuffer.get(outputId);
  }

  /**
   * Returns current kernel status.
   */
  status(): {
    running: boolean;
    iteration: number;
    phase: CyclePhase;
    engineCount: number;
    queueLength: number;
    outputCount: number;
  } {
    return {
      running: this.running,
      iteration: this.cycleState.iteration,
      phase: this.cycleState.phase,
      engineCount: this.engines.size,
      queueLength: this.inputQueue.length,
      outputCount: this.outputBuffer.size,
    };
  }

  /**
   * Returns engine states.
   */
  engineStates(): EngineState[] {
    return Array.from(this.engines.values()).map((e) => e.state);
  }

  // --------------------------------------------------------------------------
  // Private: Cycle Tick
  // --------------------------------------------------------------------------

  private async tick(): Promise<void> {
    if (!this.running) return;

    this.cycleState.iteration++;
    this.cycleState.startTime = Date.now();
    this.cycleState.isComplete = false;

    // Phase 1: Collect inputs
    const inputs = this.inputQueue.splice(0, MAX_CONCURRENT_ENGINES);
    this.cycleState.inputs = inputs;

    if (inputs.length === 0) {
      // No inputs — run a maintenance cycle (reflection/learning)
      await this.runMaintenanceCycle();
      return;
    }

    // Phase 2: Attention allocation — determine which inputs get focus
    const prioritizedInputs = this.allocateAttention(inputs);

    // Phase 3: Route inputs to appropriate engines
    const processes: Promise<EngineProcess | null>[] = [];

    for (const input of prioritizedInputs) {
      const engineId = this.routeToEngine(input);
      const engine = this.engines.get(engineId);
      if (!engine || !engine.config.enabled) continue;

      // Check dependencies
      const depsReady = engine.config.dependencies.every((dep) => {
        const depEngine = this.engines.get(dep);
        return depEngine && depEngine.state.status !== 'error';
      });

      if (!depsReady) continue;

      processes.push(this.executeEngine(engine, input));
    }

    // Phase 4: Collect results
    const results = await Promise.all(processes);

    // Phase 5: Store outputs and memory
    for (const result of results) {
      if (!result) continue;

      this.cycleState.outputs.set(result.output.engineId, result.output);
      this.outputBuffer.set(result.output.id, result.output);

      // Store memory writes
      for (const mem of result.memoryWrites) {
        globalMemoryStore.store(mem);
      }
    }

    // Phase 6: Memory promotion/demotion
    globalMemoryStore.cleanup();

    // Phase 7: Cycle completion
    this.cycleState.isComplete = true;

    // Store cycle summary in episodic memory
    const cycleSummary = createMemory(
      'episodic',
      {
        iteration: this.cycleState.iteration,
        phase: this.cycleState.phase,
        inputCount: inputs.length,
        outputCount: this.cycleState.outputs.size,
        latency: Date.now() - this.cycleState.startTime,
      },
      {
        source: 'executive',
        confidence: 1.0,
        salience: 0.3,
        tags: ['cycle', 'executive'],
      }
    );
    globalMemoryStore.store(cycleSummary);
  }

  private async runMaintenanceCycle(): Promise<void> {
    // Run reflection and learning engines on working memory
    const workingMemories = await globalMemoryStore.query({ tier: 'working', limit: 7 });

    for (const retrieval of workingMemories) {
      // Trigger reflection on significant memories
      if (retrieval.envelope.metadata.salience > 0.7) {
        const reflectionEngine = this.engines.get('reflection');
        if (reflectionEngine && reflectionEngine.config.enabled) {
          const input: CognitiveInput = {
            id: `maint_${Date.now()}_${retrieval.envelope.id}`,
            source: 'executive',
            type: 'reflection_trigger',
            payload: retrieval.envelope,
            context: {
              environment: { maintenance: true },
              history: [],
              relevance: retrieval.relevance,
              decay: 0.1,
            },
            timestamp: Date.now(),
            priority: 30,
          };
          await this.executeEngine(reflectionEngine, input);
        }
      }
    }
  }

  private allocateAttention(inputs: CognitiveInput[]): CognitiveInput[] {
    // Sort by priority (lower number = higher priority)
    return inputs
      .map((input) => ({
        input,
        score: input.priority,
      }))
      .sort((a, b) => a.score - b.score)
      .map((item) => item.input);
  }

  private routeToEngine(input: CognitiveInput): EngineId {
    // Simple routing based on intent type
    const intentMap: Record<string, EngineId> = {
      identity: 'identity',
      observe: 'observation',
      validate: 'evidence',
      know: 'knowledge',
      understand: 'understanding',
      reason: 'reasoning',
      simulate: 'simulation',
      decide: 'decision',
      plan: 'planning',
      act: 'action',
      feedback: 'feedback',
      reflect: 'reflection',
      learn: 'learning',
      adapt: 'adaptation',
      wisdom: 'wisdom',
      collective: 'collective',
      evolve: 'evolution',
    };

    const mapped = intentMap[input.type];
    if (mapped && this.engines.has(mapped)) {
      return mapped;
    }

    // Default to observation for unknown intents
    return 'observation';
  }

  private async executeEngine(
    engine: CognitiveEngine,
    input: CognitiveInput
  ): Promise<EngineProcess | null> {
    const baseEngine = engine as BaseEngine;
    const output = await baseEngine.run(input);

    if (!output) return null;

    // Create memory envelope for the process
    const processMemory = createMemory(
      'working',
      {
        input: input.id,
        output: output.id,
        engine: engine.id,
        latency: output.latencyMs,
      },
      {
        source: engine.id,
        confidence: output.confidence,
        salience: 0.5,
        tags: ['process', engine.id],
      }
    );

    return {
      input,
      output,
      memoryWrites: [processMemory],
      memoryReads: [],
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const kernel = new CognitiveKernel();
