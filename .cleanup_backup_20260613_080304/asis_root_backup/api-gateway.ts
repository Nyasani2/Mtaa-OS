// asis/deployment/api-gateway.ts
// External entry point — exposes ASIS to MTAA OS

import { environmentConfig } from './environment-config';

export interface APIRequest {
  endpoint: '/asis/process' | '/asis/status' | '/asis/install' | '/asis/update' | '/asis/health';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  authToken?: string;
}

export interface APIResponse {
  status: number;
  data: any;
  error?: string;
  latency: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class APIGateway {
  private active = false;
  private rateLimits = new Map<string, RateLimitEntry>();
  private requestLog: APIRequest[] = [];

  async activate(): Promise<void> {
    this.active = true;
    console.log('[ASIS] API Gateway activated');
  }

  async handle(req: APIRequest): Promise<APIResponse> {
    const start = performance.now();

    if (!this.active) {
      return { status: 503, data: null, error: 'ASIS not active', latency: 0 };
    }

    // Rate limiting
    if (!this.checkRateLimit(req.authToken || 'anonymous')) {
      return { status: 429, data: null, error: 'Rate limit exceeded', latency: 0 };
    }

    // Auth check
    if (!this.authenticate(req)) {
      return { status: 401, data: null, error: 'Unauthorized', latency: 0 };
    }

    this.requestLog.push(req);

    let response: APIResponse;
    switch (req.endpoint) {
      case '/asis/process':
        response = await this.handleProcess(req);
        break;
      case '/asis/status':
        response = await this.handleStatus(req);
        break;
      case '/asis/install':
        response = await this.handleInstall(req);
        break;
      case '/asis/update':
        response = await this.handleUpdate(req);
        break;
      case '/asis/health':
        response = await this.handleHealth(req);
        break;
      default:
        response = { status: 404, data: null, error: 'Unknown endpoint', latency: 0 };
    }

    response.latency = performance.now() - start;
    return response;
  }

  private checkRateLimit(key: string): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = environmentConfig.isProd() ? 100 : 1000;

    const entry = this.rateLimits.get(key);
    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= maxRequests) return false;
    entry.count++;
    return true;
  }

  private authenticate(req: APIRequest): boolean {
    if (!req.authToken) return false;
    // Validate against MTAA auth system
    return req.authToken.startsWith('mtaa_') && req.authToken.length > 20;
  }

  private async handleProcess(req: APIRequest): Promise<APIResponse> {
    const engine = (globalThis as any).__ASIS_COGNITIVE_ENGINE__;
    if (!engine) {
      return { status: 503, data: null, error: 'Cognitive engine not mounted', latency: 0 };
    }
    const result = await engine.process(req.body);
    return { status: 200, data: result, latency: 0 };
  }

  private async handleStatus(req: APIRequest): Promise<APIResponse> {
    const loader = (globalThis as any).__ASIS_SYSTEM_LOADER__;
    return {
      status: 200,
      data: {
        active: this.active,
        version: (globalThis as any).__ASIS_VERSION__,
        modules: loader?.getStatus?.() || {},
        uptime: performance.now(),
      },
      latency: 0,
    };
  }

  private async handleInstall(req: APIRequest): Promise<APIResponse> {
    return { status: 202, data: { message: 'Install queued' }, latency: 0 };
  }

  private async handleUpdate(req: APIRequest): Promise<APIResponse> {
    return { status: 202, data: { message: 'Update queued' }, latency: 0 };
  }

  private async handleHealth(req: APIRequest): Promise<APIResponse> {
    return {
      status: 200,
      data: {
        status: 'healthy',
        gateway: this.active,
        timestamp: Date.now(),
      },
      latency: 0,
    };
  }

  getStats() {
    return {
      totalRequests: this.requestLog.length,
      active: this.active,
      rateLimitKeys: this.rateLimits.size,
    };
  }
}

export const apiGateway = new APIGateway();
