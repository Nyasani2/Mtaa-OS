/**
 * ASIS CSE — Evidence Engine
 * "Can this be trusted?" — Validates observations into evidence.
 */

import { BaseEngine } from './asis-cse-kernel';
import { globalMemoryStore, createMemory } from './asis-cse-memory';

import type {
  EngineId,
  CognitiveInput,
  CognitiveOutput,
} from './asis-cse-types';

import { KNOWLEDGE_CONFIDENCE_THRESHOLD } from './asis-cse-constants';

export type EvidenceType = 'verified' | 'probable' | 'weak' | 'conflicting' | 'unknown' | 'rejected';

export interface Evidence {
  id: string;
  observationIds: string[];
  claim: string;
  evidenceType: EvidenceType;
  confidence: {
    observation: number;
    verification: number;
    agreement: number;
    temporal: number;
    overall: number;
  };
  sources: string[];
  contradictions: string[];
  hypotheses: EvidenceHypothesis[];
  timestamp: number;
}

export interface EvidenceHypothesis {
  id: string;
  claim: string;
  confidence: number;
  supporting: string[];
  opposing: string[];
}

export class EvidenceEngine extends BaseEngine {
  readonly id: EngineId = 'evidence';
  private evidence: Map<string, Evidence> = new Map();

  constructor() {
    super();
    this.config.priority = 30;
    this.config.dependencies = ['observation'];
  }

  async process(input: CognitiveInput): Promise<CognitiveOutput> {
    const startTime = Date.now();
    const { payload } = input;

    const action = (payload as Record<string, unknown>)?.action as string;
    const observations = (payload as Record<string, unknown>)?.observations as Array<{
      id: string;
      source: string;
      confidence: number;
      rawData: unknown;
      timestamp: number;
    }>;

    let result: unknown;
    const confidence = 0.8;

    switch (action) {
      case 'validate':
        result = this.validateObservations(observations ?? []);
        break;
      case 'query':
        result = this.queryEvidence((payload as Record<string, unknown>)?.evidenceId as string);
        break;
      case 'conflicts':
        result = this.detectConflicts();
        break;
      default:
        result = { evidenceCount: this.evidence.size };
    }

    const mem = createMemory(
      'working',
      { evidenceCount: this.evidence.size, action },
      { source: 'evidence', confidence, salience: 0.6, tags: ['evidence', 'validation'] }
    );
    globalMemoryStore.store(mem);

    return {
      id: `out_${Date.now()}`,
      engineId: this.id,
      inputId: input.id,
      type: 'evidence_set',
      payload: result,
      confidence,
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  private validateObservations(
    observations: Array<{
      id: string;
      source: string;
      confidence: number;
      rawData: unknown;
      timestamp: number;
    }>
  ): Evidence[] {
    const validated: Evidence[] = [];

    // Group by similar claim (simple: same source type or data hash)
    const groups = this.groupObservations(observations);

    for (const group of groups) {
      const sourceConf = this.computeSourceConfidence(group);
      const verifyConf = this.computeVerificationConfidence(group);
      const agreeConf = this.computeAgreementConfidence(group);
      const temporalConf = this.computeTemporalConfidence(group);

      const overall = (sourceConf + verifyConf + agreeConf + temporalConf) / 4;

      let evidenceType: EvidenceType = 'unknown';
      if (overall >= 0.9) evidenceType = 'verified';
      else if (overall >= 0.7) evidenceType = 'probable';
      else if (overall >= 0.4) evidenceType = 'weak';
      else evidenceType = 'rejected';

      const evidence: Evidence = {
        id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        observationIds: group.map((o) => o.id),
        claim: this.extractClaim(group),
        evidenceType,
        confidence: {
          observation: sourceConf,
          verification: verifyConf,
          agreement: agreeConf,
          temporal: temporalConf,
          overall,
        },
        sources: [...new Set(group.map((o) => o.source))],
        contradictions: [],
        hypotheses: [{
          id: `hyp_${Date.now()}`,
          claim: this.extractClaim(group),
          confidence: overall,
          supporting: group.map((o) => o.id),
          opposing: [],
        }],
        timestamp: Date.now(),
      };

      this.evidence.set(evidence.id, evidence);
      validated.push(evidence);
    }

    return validated;
  }

  private groupObservations(
    observations: Array<{ id: string; source: string; confidence: number; rawData: unknown; timestamp: number }>
  ): Array<Array<{ id: string; source: string; confidence: number; rawData: unknown; timestamp: number }>> {
    // Simple grouping by source prefix (e.g., "sensor_" groups together)
    const groups = new Map<string, typeof observations>();
    for (const obs of observations) {
      const prefix = obs.source.split('_')[0] ?? 'default';
      if (!groups.has(prefix)) groups.set(prefix, []);
      groups.get(prefix)!.push(obs);
    }
    return Array.from(groups.values());
  }

  private computeSourceConfidence(group: Array<{ confidence: number }>): number {
    if (group.length === 0) return 0;
    return group.reduce((sum, o) => sum + o.confidence, 0) / group.length;
  }

  private computeVerificationConfidence(group: Array<{ source: string }>): number {
    // More unique sources = higher verification confidence
    const uniqueSources = new Set(group.map((o) => o.source)).size;
    return Math.min(uniqueSources / 3, 1.0); // Cap at 3+ sources
  }

  private computeAgreementConfidence(group: Array<{ rawData: unknown }>): number {
    // Agreement = how similar the data is across observations
    if (group.length < 2) return 0.5;
    const first = JSON.stringify(group[0].rawData);
    const matches = group.filter((o) => JSON.stringify(o.rawData) === first).length;
    return matches / group.length;
  }

  private computeTemporalConfidence(group: Array<{ timestamp: number }>): number {
    // Recency = higher confidence
    const now = Date.now();
    const avgAge = group.reduce((sum, o) => sum + (now - o.timestamp), 0) / group.length;
    const halfLife = 3600000; // 1 hour
    return Math.exp(-avgAge / halfLife);
  }

  private extractClaim(group: Array<{ rawData: unknown }>): string {
    // Simple claim extraction: use first observation's data as claim string
    const first = group[0];
    if (typeof first.rawData === 'string') return first.rawData;
    return JSON.stringify(first.rawData).slice(0, 200);
  }

  private queryEvidence(evidenceId?: string): unknown {
    if (evidenceId) return this.evidence.get(evidenceId) ?? null;
    return Array.from(this.evidence.values()).slice(0, 50);
  }

  private detectConflicts(): { conflicts: Array<{ evidenceA: string; evidenceB: string; reason: string }> } {
    const conflicts: Array<{ evidenceA: string; evidenceB: string; reason: string }> = [];
    const allEvidence = Array.from(this.evidence.values());

    for (let i = 0; i < allEvidence.length; i++) {
      for (let j = i + 1; j < allEvidence.length; j++) {
        const a = allEvidence[i];
        const b = allEvidence[j];

        // Check for contradictory claims (simple: different claims from same source)
        const sharedSources = a.sources.filter((s) => b.sources.includes(s));
        if (sharedSources.length > 0 && a.claim !== b.claim) {
          conflicts.push({
            evidenceA: a.id,
            evidenceB: b.id,
            reason: `Contradictory claims from shared sources: ${sharedSources.join(', ')}`,
          });
        }
      }
    }

    return { conflicts };
  }
}
