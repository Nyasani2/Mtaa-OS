/**
 * ASIS CSE — Attention Engine
 * "What deserves cognitive resources now?" — Allocates focus dynamically.
 */

import { BaseEngine } from './asis-cse-kernel';
import { globalMemoryStore, createMemory } from './asis-cse-memory';
import { normalize } from './asis-cse-kamos';

import type {
  EngineId,
  CognitiveInput,
  CognitiveOutput,
} from './asis-cse-types';

import { DEFAULT_ATTENTION, MAX_ATTENTION, ATTENTION_DECAY, NOVELTY_BONUS } from './asis-cse-constants';

export interface AttentionAllocation {
  inputId: string;
  source: string;
  type: string;
  attentionScore: number;
  factors: AttentionFactor[];
  allocatedAt: number;
}

export interface AttentionFactor {
  name: string;
  weight: number;
  score: number;
}

export class AttentionEngine extends BaseEngine {
  readonly id: EngineId = 'attention';
  private allocations: Map<string, AttentionAllocation> = new Map();
  private totalAttention = 0;

  constructor() {
    super();
    this.config.priority = 20;
    this.config.dependencies = ['purpose'];
  }

  async process(input: CognitiveInput): Promise<CognitiveOutput> {
    const startTime = Date.now();
    const { payload } = input;

    const action = (payload as Record<string, unknown>)?.action as string;
    const candidates = (payload as Record<string, unknown>)?.candidates as Array<{
      inputId: string;
      source: string;
      type: string;
      urgency?: number;
      novelty?: number;
      importance?: number;
      risk?: number;
    }>;

    let result: unknown;
    const confidence = 0.8;

    switch (action) {
      case 'allocate':
        result = this.allocateAttention(candidates ?? []);
        break;
      case 'focus':
        result = this.getFocus();
        break;
      case 'decay':
        result = this.decayAll();
        break;
      default:
        result = this.getFocus();
    }

    const mem = createMemory(
      'working',
      { allocations: this.allocations.size, totalAttention: this.totalAttention },
      { source: 'attention', confidence, salience: 0.5, tags: ['attention', 'focus'] }
    );
    globalMemoryStore.store(mem);

    return {
      id: `out_${Date.now()}`,
      engineId: this.id,
      inputId: input.id,
      type: 'attention_map',
      payload: result,
      confidence,
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  private allocateAttention(
    candidates: Array<{
      inputId: string;
      source: string;
      type: string;
      urgency?: number;
      novelty?: number;
      importance?: number;
      risk?: number;
    }>
  ): AttentionAllocation[] {
    const allocations: AttentionAllocation[] = [];

    for (const candidate of candidates) {
      const factors: AttentionFactor[] = [
        { name: 'urgency', weight: 0.3, score: normalize(candidate.urgency ?? 0.5, 0, 1) },
        { name: 'novelty', weight: 0.2, score: normalize(candidate.novelty ?? 0.5, 0, 1) },
        { name: 'importance', weight: 0.25, score: normalize(candidate.importance ?? 0.5, 0, 1) },
        { name: 'risk', weight: 0.25, score: normalize(candidate.risk ?? 0.5, 0, 1) },
      ];

      const score = factors.reduce((sum, f) => sum + f.weight * f.score, 0);

      const allocation: AttentionAllocation = {
        inputId: candidate.inputId,
        source: candidate.source,
        type: candidate.type,
        attentionScore: Math.min(score * MAX_ATTENTION, MAX_ATTENTION),
        factors,
        allocatedAt: Date.now(),
      };

      this.allocations.set(candidate.inputId, allocation);
      allocations.push(allocation);
    }

    this.totalAttention = Math.min(
      Array.from(this.allocations.values()).reduce((sum, a) => sum + a.attentionScore, 0),
      MAX_ATTENTION
    );

    // Sort by attention score descending
    allocations.sort((a, b) => b.attentionScore - a.attentionScore);
    return allocations;
  }

  private getFocus(): AttentionAllocation | null {
    const sorted = Array.from(this.allocations.values()).sort(
      (a, b) => b.attentionScore - a.attentionScore
    );
    return sorted[0] ?? null;
  }

  private decayAll(): { decayed: number } {
    let decayed = 0;
    for (const [id, alloc] of this.allocations) {
      const age = Date.now() - alloc.allocatedAt;
      const decayFactor = Math.exp(-ATTENTION_DECAY * (age / 1000));
      alloc.attentionScore *= decayFactor;

      if (alloc.attentionScore < 0.01) {
        this.allocations.delete(id);
        decayed++;
      }
    }
    return { decayed };
  }
}
