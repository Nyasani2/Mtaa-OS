// @ts-nocheck
/**
 * ASIS CSE — Identity Engine
 * "Who am I?" — The first cognitive process.
 * Manages user, device, community, and agent identity with dynamic trust.
 */

import { BaseEngine } from './asis-cse-kernel';
import { globalMemoryStore, createMemory } from './asis-cse-memory';
import { persistIdentity, createEntity, cosineSimilarity } from './asis-cse-kamos';
import { trustRegistry } from './asis-cse-api';

import type {
  EngineId,
  CognitiveInput,
  CognitiveOutput,
  IdentityVector,
  MemoryEnvelope,
} from './asis-cse-types';

import { IDENTITY_PERSISTENCE, DEFAULT_TRUST_SCORE } from './asis-cse-constants';

export interface IdentityProfile {
  userId: string;
  type: 'personal' | 'device' | 'community' | 'agent' | 'system';
  profile: Record<string, unknown>;
  preferences: Record<string, unknown>;
  permissions: string[];
  relationships: IdentityRelationship[];
  trustScore: number;
  createdAt: number;
  lastActive: number;
}

export interface IdentityRelationship {
  targetId: string;
  type: string;
  strength: number;
  trust: number;
  lastInteraction: number;
}

export class IdentityEngine extends BaseEngine {
  readonly id: EngineId = 'identity';
  private profiles: Map<string, IdentityProfile> = new Map();

  constructor() {
    super();
    this.config.priority = 5; // Highest priority
    this.config.dependencies = [];
  }

  async initialize(): Promise<void> {
    // Load identity profiles from semantic memory
    const memories = await globalMemoryStore.query({
      tier: 'semantic',
      tags: ['identity', 'profile'],
      limit: 100,
    });

    for (const retrieval of memories) {
      const profile = retrieval.envelope.payload as IdentityProfile;
      this.profiles.set(profile.userId, profile);
    }

    console.log(`[IdentityEngine] Loaded ${this.profiles.size} profiles`);
  }

  async process(input: CognitiveInput): Promise<CognitiveOutput> {
    const startTime = Date.now();
    const { source, payload, context } = input;

    const action = (payload as Record<string, unknown>)?.action as string;
    const userId = (payload as Record<string, unknown>)?.userId as string ?? source;

    let result: unknown;
    const confidence = 0.9;

    switch (action) {
      case 'resolve':
        result = this.resolveIdentity(userId);
        break;
      case 'update':
        result = this.updateIdentity(userId, payload as Record<string, unknown>);
        break;
      case 'trust':
        result = this.evaluateTrust(userId, payload as Record<string, unknown>);
        break;
      case 'relate':
        result = this.updateRelationship(userId, payload as Record<string, unknown>);
        break;
      default:
        result = this.resolveIdentity(userId);
    }

    // Persist identity to memory
    const profile = this.profiles.get(userId);
    if (profile) {
      const mem = createMemory(
        'semantic',
        profile,
        {
          source: 'identity',
          confidence,
          salience: 0.8,
          tags: ['identity', 'profile', profile.type],
          relations: profile.relationships.map((r) => r.targetId),
        }
      );
      globalMemoryStore.store(mem);
    }

    return {
      id: `out_${Date.now()}`,
      engineId: this.id,
      inputId: input.id,
      type: 'identity_context',
      payload: result,
      confidence,
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  private resolveIdentity(userId: string): IdentityProfile | null {
    let profile = this.profiles.get(userId);
    if (!profile) {
      // Create default identity
      profile = {
        userId,
        type: 'personal',
        profile: {},
        preferences: {},
        permissions: ['observe', 'read_memory'],
        relationships: [],
        trustScore: DEFAULT_TRUST_SCORE,
        createdAt: Date.now(),
        lastActive: Date.now(),
      };
      this.profiles.set(userId, profile);
    }
    profile.lastActive = Date.now();
    return profile;
  }

  private updateIdentity(userId: string, data: Record<string, unknown>): IdentityProfile {
    const profile = this.resolveIdentity(userId)!;

    if (data.profile) {
      profile.profile = { ...profile.profile, ...(data.profile as Record<string, unknown>) };
    }
    if (data.preferences) {
      profile.preferences = { ...profile.preferences, ...(data.preferences as Record<string, unknown>) };
    }
    if (data.permissions) {
      profile.permissions = [...new Set([...profile.permissions, ...(data.permissions as string[])])];
    }

    profile.lastActive = Date.now();
    return profile;
  }

  private evaluateTrust(userId: string, data: Record<string, unknown>): { score: number; factors: string[] } {
    const profile = this.resolveIdentity(userId);
    if (!profile) return { score: DEFAULT_TRUST_SCORE, factors: ['default'] };

    const trust = trustRegistry.getScore(userId);
    profile.trustScore = trust.score;

    return {
      score: trust.score,
      factors: trust.factors.map((f) => f.name),
    };
  }

  private updateRelationship(userId: string, data: Record<string, unknown>): IdentityRelationship[] {
    const profile = this.resolveIdentity(userId)!;
    const targetId = data.targetId as string;
    const type = data.relType as string;
    const strength = data.strength as number ?? 0.5;

    const existing = profile.relationships.find((r) => r.targetId === targetId);
    if (existing) {
      existing.type = type ?? existing.type;
      existing.strength = ema(strength, existing.strength, 0.3);
      existing.lastInteraction = Date.now();
    } else {
      profile.relationships.push({
        targetId,
        type: type ?? 'association',
        strength,
        trust: DEFAULT_TRUST_SCORE,
        lastInteraction: Date.now(),
      });
    }

    return profile.relationships;
  }
}

// Simple EMA helper
function ema(current: number, previous: number, alpha: number): number {
  return alpha * current + (1 - alpha) * previous;
}
