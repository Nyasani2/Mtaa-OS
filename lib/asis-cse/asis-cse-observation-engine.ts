/**
 * ASIS CSE — Observation Engine
 * "What exists in reality?" — Collects, never interprets.
 * Normalizes and timestamps raw observations from all sources.
 */

import { BaseEngine } from './asis-cse-kernel';
import { globalMemoryStore, createMemory } from './asis-cse-memory';
import { amplifyObservation } from './asis-cse-kamos';

import type {
  EngineId,
  CognitiveInput,
  CognitiveOutput,
} from './asis-cse-types';

import { OBSERVATION_THRESHOLD } from './asis-cse-constants';

export interface Observation {
  id: string;
  source: string;
  sourceType: 'user' | 'sensor' | 'api' | 'memory' | 'device' | 'internet' | 'iot' | 'expert';
  timestamp: number;
  location?: { lat: number; lng: number };
  language?: string;
  device?: string;
  rawData: unknown;
  normalizedData: unknown;
  confidence: number;
  mediaType: 'text' | 'image' | 'audio' | 'video' | 'sensor' | 'structured';
  collectionMethod: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  metadata: Record<string, unknown>;
}

export class ObservationEngine extends BaseEngine {
  readonly id: EngineId = 'observation';
  private observations: Map<string, Observation> = new Map();
  private sourceStats: Map<string, { count: number; avgConfidence: number }> = new Map();

  constructor() {
    super();
    this.config.priority = 25;
    this.config.dependencies = ['attention'];
  }

  async process(input: CognitiveInput): Promise<CognitiveOutput> {
    const startTime = Date.now();
    const { payload } = input;

    const action = (payload as Record<string, unknown>)?.action as string;
    const rawObservations = (payload as Record<string, unknown>)?.observations as Array<Record<string, unknown>>;

    let result: unknown;
    const confidence = 0.85;

    switch (action) {
      case 'collect':
        result = this.collectObservations(rawObservations ?? []);
        break;
      case 'query':
        result = this.queryObservations((payload as Record<string, unknown>)?.filters as Record<string, unknown>);
        break;
      case 'coverage':
        result = this.assessCoverage();
        break;
      default:
        result = this.assessCoverage();
    }

    const mem = createMemory(
      'sensory',
      { observationCount: this.observations.size, lastAction: action },
      { source: 'observation', confidence, salience: 0.4, tags: ['observation', 'raw_data'] }
    );
    globalMemoryStore.store(mem);

    return {
      id: `out_${Date.now()}`,
      engineId: this.id,
      inputId: input.id,
      type: 'observation_set',
      payload: result,
      confidence,
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  private collectObservations(rawData: Array<Record<string, unknown>>): { collected: number; filtered: number; observations: Observation[] } {
    const observations: Observation[] = [];
    let filtered = 0;

    for (const raw of rawData) {
      const rawSignal = (raw.confidence as number) ?? 0.5;
      const amplified = amplifyObservation(rawSignal);

      if (amplified < OBSERVATION_THRESHOLD) {
        filtered++;
        continue;
      }

      const obs: Observation = {
        id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        source: raw.source as string ?? 'unknown',
        sourceType: (raw.sourceType as Observation['sourceType']) ?? 'api',
        timestamp: Date.now(),
        location: raw.location as { lat: number; lng: number },
        language: raw.language as string,
        device: raw.device as string,
        rawData: raw.data,
        normalizedData: this.normalize(raw.data),
        confidence: amplified,
        mediaType: (raw.mediaType as Observation['mediaType']) ?? 'text',
        collectionMethod: raw.collectionMethod as string ?? 'automatic',
        verificationStatus: 'unverified',
        metadata: raw.metadata as Record<string, unknown> ?? {},
      };

      this.observations.set(obs.id, obs);
      observations.push(obs);

      // Update source stats
      const stats = this.sourceStats.get(obs.source) ?? { count: 0, avgConfidence: 0 };
      stats.count++;
      stats.avgConfidence = (stats.avgConfidence * (stats.count - 1) + obs.confidence) / stats.count;
      this.sourceStats.set(obs.source, stats);
    }

    return { collected: observations.length, filtered, observations };
  }

  private normalize(data: unknown): unknown {
    if (typeof data === 'string') {
      return data.trim().toLowerCase();
    }
    if (typeof data === 'number') {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.normalize(item));
    }
    if (data && typeof data === 'object') {
      const normalized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(data)) {
        normalized[key.toLowerCase().trim()] = this.normalize(val);
      }
      return normalized;
    }
    return data;
  }

  private queryObservations(filters?: Record<string, unknown>): Observation[] {
    let results = Array.from(this.observations.values());

    if (filters?.source) {
      results = results.filter((o) => o.source === filters.source);
    }
    if (filters?.sourceType) {
      results = results.filter((o) => o.sourceType === filters.sourceType);
    }
    if (filters?.minConfidence) {
      results = results.filter((o) => o.confidence >= (filters.minConfidence as number));
    }
    if (filters?.after) {
      results = results.filter((o) => o.timestamp >= (filters.after as number));
    }
    if (filters?.limit) {
      results = results.slice(0, filters.limit as number);
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  private assessCoverage(): {
    total: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
    avgConfidence: number;
    gaps: string[];
  } {
    const obs = Array.from(this.observations.values());
    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const o of obs) {
      bySource[o.source] = (bySource[o.source] ?? 0) + 1;
      byType[o.mediaType] = (byType[o.mediaType] ?? 0) + 1;
    }

    const avgConfidence = obs.length > 0
      ? obs.reduce((sum, o) => sum + o.confidence, 0) / obs.length
      : 0;

    const gaps: string[] = [];
    if (!byType['sensor']) gaps.push('sensor');
    if (!byType['image']) gaps.push('visual');
    if (avgConfidence < 0.5) gaps.push('low_confidence');

    return { total: obs.length, bySource, byType, avgConfidence, gaps };
  }
}
