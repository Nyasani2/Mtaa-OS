/**
 * ASIS CSE — Cognitive API
 * Single communication interface. No direct engine access.
 * Apps communicate via this API only.
 */

import {
  API_TIMEOUT_MS,
  MAX_REQUEST_SIZE,
  DEFAULT_TRUST_SCORE,
  TRUST_DECAY_RATE,
  MAX_TRUST_SCORE,
  MIN_TRUST_SCORE,
} from './asis-cse-constants';

import type {
  APIRequest,
  APIResponse,
  APIEndpoint,
  ASISContext,
  TrustScore,
  TrustFactor,
  AuditLog,
  CognitiveInput,
} from './asis-cse-types';

import { kernel } from './asis-cse-kernel';
import { globalMemoryStore, createMemory } from './asis-cse-memory';

// ============================================================================
// Trust Registry
// ============================================================================

class TrustRegistry {
  private scores: Map<string, TrustScore> = new Map();
  private auditLog: AuditLog[] = [];
  private maxAuditSize = 10000;

  getScore(entityId: string): TrustScore {
    return (
      this.scores.get(entityId) ?? {
        entityId,
        score: DEFAULT_TRUST_SCORE,
        confidence: 0.5,
        factors: [],
        lastUpdated: Date.now(),
      }
    );
  }

  updateScore(entityId: string, delta: number, reason: string): TrustScore {
    const current = this.getScore(entityId);
    const newScore = Math.max(
      MIN_TRUST_SCORE,
      Math.min(MAX_TRUST_SCORE, current.score + delta)
    );

    const factor: TrustFactor = {
      name: reason,
      weight: Math.abs(delta),
      value: delta > 0 ? 1 : -1,
      evidence: [new Date().toISOString()],
    };

    const updated: TrustScore = {
      ...current,
      score: newScore,
      confidence: Math.min(1, current.confidence + 0.01),
      factors: [...current.factors, factor].slice(-20),
      lastUpdated: Date.now(),
    };

    this.scores.set(entityId, updated);
    return updated;
  }

  decayAll(): void {
    for (const [id, score] of this.scores) {
      if (Date.now() - score.lastUpdated > 86400000) {
        // Decay after 24h of inactivity
        const decayed = Math.max(MIN_TRUST_SCORE, score.score - TRUST_DECAY_RATE);
        this.scores.set(id, { ...score, score: decayed, lastUpdated: Date.now() });
      }
    }
  }

  log(audit: Omit<AuditLog, 'id'>): void {
    const entry: AuditLog = {
      ...audit,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    this.auditLog.push(entry);
    if (this.auditLog.length > this.maxAuditSize) {
      this.auditLog = this.auditLog.slice(-this.maxAuditSize / 2);
    }
  }

  getAuditLog(
    actor?: string,
    resource?: string,
    limit = 100
  ): AuditLog[] {
    let logs = this.auditLog;
    if (actor) logs = logs.filter((l) => l.actor === actor);
    if (resource) logs = logs.filter((l) => l.resource === resource);
    return logs.slice(-limit);
  }
}

export const trustRegistry = new TrustRegistry();

// ============================================================================
// Cognitive API Server
// ============================================================================

export class CognitiveAPIServer {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private requestCount = 0;
  private errorCount = 0;

  constructor() {
    this.registerDefaultEndpoints();
  }

  register(endpoint: APIEndpoint): void {
    this.endpoints.set(endpoint.path, endpoint);
  }

  /**
   * Handles an incoming API request.
   * This is the ONLY entry point for external communication.
   */
  async handle(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    this.requestCount++;

    // Trust check
    const trust = trustRegistry.getScore(request.appId);
    if (trust.score < MIN_TRUST_SCORE) {
      trustRegistry.log({
        timestamp: Date.now(),
        actor: request.appId,
        action: 'api_request',
        resource: request.intent,
        result: 'deny',
        metadata: { reason: 'trust_too_low', trustScore: trust.score },
      });

      return {
        id: `res_${Date.now()}`,
        requestId: request.id,
        status: 'error',
        payload: { error: 'Trust score too low. Entity quarantined.' },
        confidence: 0,
        engineTrace: [],
        latencyMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }

    // Route to endpoint or kernel
    const endpoint = this.endpoints.get(request.intent);
    let response: APIResponse;

    try {
      if (endpoint) {
        const result = await endpoint.handler(request);
        response = result;
      } else {
        // Default: route through cognitive kernel
        response = await this.routeToKernel(request);
      }

      // Positive trust update on success
      trustRegistry.updateScore(request.appId, 0.001, 'successful_request');
    } catch (error) {
      this.errorCount++;
      trustRegistry.updateScore(request.appId, -0.01, 'request_error');

      response = {
        id: `res_${Date.now()}`,
        requestId: request.id,
        status: 'error',
        payload: { error: (error as Error).message },
        confidence: 0,
        engineTrace: [],
        latencyMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }

    // Audit log
    trustRegistry.log({
      timestamp: Date.now(),
      actor: request.appId,
      action: request.intent,
      resource: 'cognitive_api',
      result: response.status === 'error' ? 'error' : 'allow',
      metadata: {
        latencyMs: response.latencyMs,
        confidence: response.confidence,
      },
    });

    return response;
  }

  stats(): {
    requests: number;
    errors: number;
    errorRate: number;
    endpoints: number;
  } {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      endpoints: this.endpoints.size,
    };
  }

  // --------------------------------------------------------------------------
  // Private
  // --------------------------------------------------------------------------

  private async routeToKernel(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();

    const input: CognitiveInput = {
      id: `api_${request.id}`,
      source: request.appId,
      type: request.intent,
      payload: request.payload,
      context: {
        environment: { appId: request.appId, authToken: request.authToken },
        history: [],
        relevance: 0.8,
        decay: 0.1,
      },
      timestamp: Date.now(),
      priority: 10,
    };

    kernel.inject(input);

    // Wait for output (with timeout)
    const output = await this.waitForOutput(input.id, API_TIMEOUT_MS);

    if (!output) {
      return {
        id: `res_${Date.now()}`,
        requestId: request.id,
        status: 'deferred',
        payload: { message: 'Request queued for cognitive processing' },
        confidence: 0.5,
        engineTrace: [],
        latencyMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }

    return {
      id: `res_${Date.now()}`,
      requestId: request.id,
      status: 'success',
      payload: output.payload,
      confidence: output.confidence,
      engineTrace: [output.engineId],
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  private async waitForOutput(
    inputId: string,
    timeoutMs: number
  ): Promise<import('./asis-cse-types').CognitiveOutput | null> {
    const checkInterval = 50;
    const maxChecks = timeoutMs / checkInterval;

    for (let i = 0; i < maxChecks; i++) {
      // Check all outputs in buffer
      for (const output of Array.from(kernel['outputBuffer']?.values() ?? [])) {
        if (output.inputId === inputId) {
          return output;
        }
      }
      await new Promise((r) => setTimeout(r, checkInterval));
    }

    return null;
  }

  private registerDefaultEndpoints(): void {
    // Health check
    this.register({
      path: 'health',
      method: 'query',
      authRequired: false,
      rateLimit: 100,
      handler: async () => ({
        id: `res_${Date.now()}`,
        requestId: '',
        status: 'success',
        payload: {
          status: 'healthy',
          kernel: kernel.status(),
          engines: kernel.engineStates(),
          memory: globalMemoryStore.stats(),
        },
        confidence: 1.0,
        engineTrace: ['executive'],
        latencyMs: 0,
        timestamp: Date.now(),
      }),
    });

    // Memory query
    this.register({
      path: 'memory.query',
      method: 'query',
      authRequired: true,
      rateLimit: 1000,
      handler: async (req) => {
        const query = (req.payload as Record<string, unknown>)?.query ?? {};
        const results = await globalMemoryStore.query(query as import('./asis-cse-types').MemoryQuery);
        return {
          id: `res_${Date.now()}`,
          requestId: req.id,
          status: 'success',
          payload: { results },
          confidence: 0.9,
          engineTrace: ['executive'],
          latencyMs: 0,
          timestamp: Date.now(),
        };
      },
    });

    // Trust query
    this.register({
      path: 'trust.query',
      method: 'query',
      authRequired: true,
      rateLimit: 100,
      handler: async (req) => {
        const entityId = (req.payload as Record<string, unknown>)?.entityId as string;
        const score = trustRegistry.getScore(entityId);
        return {
          id: `res_${Date.now()}`,
          requestId: req.id,
          status: 'success',
          payload: { trust: score },
          confidence: 0.95,
          engineTrace: ['security'],
          latencyMs: 0,
          timestamp: Date.now(),
        };
      },
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const cognitiveAPI = new CognitiveAPIServer();

// ============================================================================
// Client SDK (for apps)
// ============================================================================

export class CognitiveAPIClient {
  private appId: string;
  private authToken: string;
  private baseUrl: string;
  private subscribers: Map<string, Set<(res: APIResponse) => void>> = new Map();

  constructor(appId: string, authToken: string, baseUrl = 'asis://kernel') {
    this.appId = appId;
    this.authToken = authToken;
    this.baseUrl = baseUrl;
  }

  async query(intent: string, payload: unknown = {}): Promise<APIResponse> {
    const request: APIRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      appId: this.appId,
      intent,
      payload,
      authToken: this.authToken,
      timestamp: Date.now(),
    };

    return cognitiveAPI.handle(request);
  }

  async command(intent: string, payload: unknown = {}): Promise<APIResponse> {
    return this.query(intent, payload);
  }

  subscribe(intent: string, callback: (res: APIResponse) => void): () => void {
    if (!this.subscribers.has(intent)) {
      this.subscribers.set(intent, new Set());
    }
    this.subscribers.get(intent)!.add(callback);

    return () => {
      this.subscribers.get(intent)?.delete(callback);
    };
  }

  notify(intent: string, response: APIResponse): void {
    this.subscribers.get(intent)?.forEach((cb) => cb(response));
  }
}
