/**
 * ASIS CSE — Reality Engine
 * "What exists?" — Constructs world model from observation.
 * Maintains dynamic Reality Graph with confidence scores.
 */

import { BaseEngine } from './asis-cse-kernel';
import { globalMemoryStore, createMemory } from './asis-cse-memory';
import { createEntity, updateContext, amplifyObservation } from './asis-cse-kamos';

import type {
  EngineId,
  CognitiveInput,
  CognitiveOutput,
} from './asis-cse-types';

export interface RealityObject {
  id: string;
  type: 'person' | 'place' | 'object' | 'event' | 'process' | 'relationship' | 'constraint' | 'goal' | 'resource';
  properties: Record<string, unknown>;
  confidence: number;
  sourceConfidence: number;
  timeConfidence: number;
  agreementConfidence: number;
  verificationConfidence: number;
  timestamp: number;
  sources: string[];
  relationships: RealityRelation[];
}

export interface RealityRelation {
  targetId: string;
  type: string;
  strength: number;
  confidence: number;
}

export interface RealityGraph {
  objects: Map<string, RealityObject>;
  lastUpdated: number;
  overallConfidence: number;
}

export class RealityEngine extends BaseEngine {
  readonly id: EngineId = 'reality';
  private graph: RealityGraph = {
    objects: new Map(),
    lastUpdated: Date.now(),
    overallConfidence: 0.5,
  };

  constructor() {
    super();
    this.config.priority = 10;
    this.config.dependencies = ['identity'];
  }

  async process(input: CognitiveInput): Promise<CognitiveOutput> {
    const startTime = Date.now();
    const { payload } = input;

    const action = (payload as Record<string, unknown>)?.action as string;
    const observations = (payload as Record<string, unknown>)?.observations as Record<string, unknown>[];

    let result: unknown;
    let confidence = 0.8;

    switch (action) {
      case 'observe':
        result = this.ingestObservations(observations ?? []);
        break;
      case 'query':
        result = this.queryReality((payload as Record<string, unknown>)?.objectId as string);
        break;
      case 'conflict':
        result = this.resolveConflicts();
        break;
      default:
        result = { graphSize: this.graph.objects.size, confidence: this.graph.overallConfidence };
    }

    // Store reality snapshot in episodic memory
    const mem = createMemory(
      'episodic',
      {
        graphSize: this.graph.objects.size,
        overallConfidence: this.graph.overallConfidence,
        action,
      },
      {
        source: 'reality',
        confidence,
        salience: 0.6,
        tags: ['reality', 'world_model'],
      }
    );
    globalMemoryStore.store(mem);

    return {
      id: `out_${Date.now()}`,
      engineId: this.id,
      inputId: input.id,
      type: 'reality_context',
      payload: result,
      confidence,
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  private ingestObservations(observations: Record<string, unknown>[]): { ingested: number; conflicts: number } {
    let ingested = 0;
    let conflicts = 0;

    for (const obs of observations) {
      const objId = obs.id as string;
      if (!objId) continue;

      const existing = this.graph.objects.get(objId);
      const sourceConf = (obs.sourceConfidence as number) ?? 0.5;
      const timeConf = (obs.timeConfidence as number) ?? 0.5;
      const verifyConf = (obs.verificationConfidence as number) ?? 0.3;

      // Agreement confidence — how much does this match existing?
      let agreeConf = 0.5;
      if (existing) {
        const propOverlap = this.computePropertyOverlap(existing.properties, obs.properties as Record<string, unknown>);
        agreeConf = propOverlap;
        if (propOverlap < 0.5) conflicts++;
      }

      const overallConf = (sourceConf + timeConf + agreeConf + verifyConf) / 4;

      if (existing) {
        // Merge — weighted by confidence
        existing.properties = this.mergeProperties(existing.properties, obs.properties as Record<string, unknown>, overallConf);
        existing.confidence = Math.max(existing.confidence, overallConf);
        existing.timestamp = Date.now();
        existing.sources.push(obs.source as string ?? 'unknown');
      } else {
        const newObj: RealityObject = {
          id: objId,
          type: (obs.type as RealityObject['type']) ?? 'object',
          properties: (obs.properties as Record<string, unknown>) ?? {},
          confidence: overallConf,
          sourceConfidence: sourceConf,
          timeConfidence: timeConf,
          agreementConfidence: agreeConf,
          verificationConfidence: verifyConf,
          timestamp: Date.now(),
          sources: [obs.source as string ?? 'unknown'],
          relationships: [],
        };
        this.graph.objects.set(objId, newObj);
      }

      ingested++;
    }

    this.graph.lastUpdated = Date.now();
    this.recalculateOverallConfidence();

    return { ingested, conflicts };
  }

  private queryReality(objectId?: string): unknown {
    if (objectId) {
      return this.graph.objects.get(objectId) ?? null;
    }
    return {
      objects: Array.from(this.graph.objects.values()).slice(0, 50),
      count: this.graph.objects.size,
      confidence: this.graph.overallConfidence,
    };
  }

  private resolveConflicts(): { resolved: number; pending: number } {
    // Simple conflict resolution: higher confidence wins
    let resolved = 0;
    const objects = Array.from(this.graph.objects.values());

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const a = objects[i];
        const b = objects[j];
        if (a.id === b.id) continue;

        // Check for property contradictions
        const overlap = this.computePropertyOverlap(a.properties, b.properties);
        if (overlap > 0.7 && a.confidence !== b.confidence) {
          // Potential duplicate or contradiction
          if (a.confidence > b.confidence) {
            b.confidence *= 0.9; // Demote lower confidence
          } else {
            a.confidence *= 0.9;
          }
          resolved++;
        }
      }
    }

    this.recalculateOverallConfidence();
    return { resolved, pending: 0 };
  }

  private computePropertyOverlap(a: Record<string, unknown>, b: Record<string, unknown>): number {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    if (keys.size === 0) return 1;
    let matches = 0;
    for (const key of keys) {
      if (JSON.stringify(a[key]) === JSON.stringify(b[key])) matches++;
    }
    return matches / keys.size;
  }

  private mergeProperties(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>,
    incomingConf: number
  ): Record<string, unknown> {
    const merged = { ...existing };
    for (const [key, val] of Object.entries(incoming)) {
      if (!(key in merged)) {
        merged[key] = val;
      } else if (incomingConf > 0.7) {
        merged[key] = val; // Higher confidence overrides
      }
    }
    return merged;
  }

  private recalculateOverallConfidence(): void {
    const objects = Array.from(this.graph.objects.values());
    if (objects.length === 0) {
      this.graph.overallConfidence = 0.5;
      return;
    }
    const avg = objects.reduce((sum, o) => sum + o.confidence, 0) / objects.length;
    this.graph.overallConfidence = avg;
  }
}
