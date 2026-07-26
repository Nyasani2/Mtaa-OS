/**
 * ASIS CSE — Plugin Framework
 * Extends capability, never replaces cognition.
 * Plugins communicate via Cognitive API only.
 */

import {
  MAX_PLUGINS,
  PLUGIN_MEMORY_MB,
  PLUGIN_TIMEOUT_MS,
} from './asis-cse-constants';

import type {
  PluginManifest,
  PluginPermission,
  PluginHook,
  HookContext,
  MemoryAPI,
  CognitiveAPIClient,
  EngineId,
} from './asis-cse-types';

import { globalMemoryStore } from './asis-cse-memory';
import { CognitiveAPIClient as APIClient } from './asis-cse-api';

// ============================================================================
// Plugin Sandbox
// ============================================================================

export class PluginSandbox {
  private manifest: PluginManifest;
  private hooks: Map<string, PluginHook[]>;
  private memoryUsed = 0;
  private active = false;

  constructor(manifest: PluginManifest) {
    this.manifest = manifest;
    this.hooks = new Map();

    for (const hook of manifest.hooks) {
      if (!this.hooks.has(hook.event)) {
        this.hooks.set(hook.event, []);
      }
      this.hooks.get(hook.event)!.push(hook);
    }
  }

  get id(): string {
    return this.manifest.id;
  }

  get isActive(): boolean {
    return this.active;
  }

  async activate(): Promise<boolean> {
    if (this.active) return true;

    // Validate permissions
    const validPermissions = this.validatePermissions();
    if (!validPermissions) {
      console.error(`[Plugin ${this.id}] Permission validation failed`);
      return false;
    }

    this.active = true;
    console.log(`[Plugin ${this.id}] Activated`);
    return true;
  }

  async deactivate(): Promise<void> {
    this.active = false;
    console.log(`[Plugin ${this.id}] Deactivated`);
  }

  async executeHook(
    event: string,
    payload: unknown,
    source: string
  ): Promise<unknown[]> {
    if (!this.active) return [];

    const hooks = this.hooks.get(event);
    if (!hooks) return [];

    const results: unknown[] = [];

    // Create restricted API context
    const memoryAPI: MemoryAPI = {
      query: async (q) => {
        if (!this.manifest.permissions.includes('memory:read')) {
          throw new Error('Plugin lacks memory:read permission');
        }
        return globalMemoryStore.query(q);
      },
      store: async (envelope) => {
        if (!this.manifest.permissions.includes('memory:write')) {
          throw new Error('Plugin lacks memory:write permission');
        }
        return globalMemoryStore.store({
          ...envelope,
          id: `plugin_${this.id}_${Date.now()}`,
          createdAt: Date.now(),
        });
      },
      forget: async (id) => {
        if (!this.manifest.permissions.includes('memory:write')) {
          throw new Error('Plugin lacks memory:write permission');
        }
        return globalMemoryStore.forget(id);
      },
    };

    const apiClient = new APIClient(this.id, `plugin_${this.id}_token`);

    const context: HookContext = {
      event,
      payload,
      memory: memoryAPI,
      api: apiClient,
      source,
    };

    for (const hook of hooks.sort((a, b) => a.priority - b.priority)) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Plugin hook timeout')), PLUGIN_TIMEOUT_MS);
        });

        const result = await Promise.race([hook.handler(context), timeoutPromise]);
        results.push(result);
      } catch (error) {
        console.error(`[Plugin ${this.id}] Hook error:`, (error as Error).message);
      }
    }

    return results;
  }

  hasPermission(permission: PluginPermission): boolean {
    return this.manifest.permissions.includes(permission);
  }

  private validatePermissions(): boolean {
    const validPermissions: PluginPermission[] = [
      'memory:read',
      'memory:write',
      'api:query',
      'api:command',
      'engine:observe',
      'engine:extend',
      'user:profile',
    ];

    return this.manifest.permissions.every((p) =>
      validPermissions.includes(p as PluginPermission)
    );
  }
}

// ============================================================================
// Plugin Manager
// ============================================================================

export class PluginManager {
  private plugins: Map<string, PluginSandbox> = new Map();
  private eventSubscribers: Map<string, Set<string>> = new Map();
  private maxPlugins = MAX_PLUGINS;

  async loadPlugin(manifest: PluginManifest): Promise<boolean> {
    if (this.plugins.size >= this.maxPlugins) {
      console.error('[PluginManager] Max plugins reached');
      return false;
    }

    if (this.plugins.has(manifest.id)) {
      console.error(`[PluginManager] Plugin ${manifest.id} already loaded`);
      return false;
    }

    const sandbox = new PluginSandbox(manifest);
    const activated = await sandbox.activate();

    if (!activated) {
      return false;
    }

    this.plugins.set(manifest.id, sandbox);

    // Register event subscriptions
    for (const hook of manifest.hooks) {
      if (!this.eventSubscribers.has(hook.event)) {
        this.eventSubscribers.set(hook.event, new Set());
      }
      this.eventSubscribers.get(hook.event)!.add(manifest.id);
    }

    console.log(`[PluginManager] Loaded plugin: ${manifest.id}`);
    return true;
  }

  async unloadPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    await plugin.deactivate();
    this.plugins.delete(pluginId);

    // Remove event subscriptions
    for (const [event, subscribers] of this.eventSubscribers) {
      subscribers.delete(pluginId);
      if (subscribers.size === 0) {
        this.eventSubscribers.delete(event);
      }
    }

    console.log(`[PluginManager] Unloaded plugin: ${pluginId}`);
    return true;
  }

  async dispatchEvent(event: string, payload: unknown, source: string): Promise<unknown[]> {
    const subscribers = this.eventSubscribers.get(event);
    if (!subscribers) return [];

    const results: unknown[] = [];

    for (const pluginId of subscribers) {
      const plugin = this.plugins.get(pluginId);
      if (!plugin || !plugin.isActive) continue;

      try {
        const hookResults = await plugin.executeHook(event, payload, source);
        results.push(...hookResults);
      } catch (error) {
        console.error(`[PluginManager] Event dispatch error for ${pluginId}:`, error);
      }
    }

    return results;
  }

  getPlugin(pluginId: string): PluginSandbox | undefined {
    return this.plugins.get(pluginId);
  }

  listPlugins(): { id: string; active: boolean; permissions: string[] }[] {
    return Array.from(this.plugins.values()).map((p) => ({
      id: p.id,
      active: p.isActive,
      permissions: this.plugins.get(p.id)?.['manifest']?.permissions ?? [],
    }));
  }

  stats(): {
    loaded: number;
    active: number;
    events: number;
    maxPlugins: number;
  } {
    const plugins = Array.from(this.plugins.values());
    return {
      loaded: plugins.length,
      active: plugins.filter((p) => p.isActive).length,
      events: this.eventSubscribers.size,
      maxPlugins: this.maxPlugins,
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const pluginManager = new PluginManager();

// ============================================================================
// Plugin Factory
// ============================================================================

export const createPluginManifest = (
  id: string,
  name: string,
  options: Partial<PluginManifest> = {}
): PluginManifest => ({
  id,
  name,
  version: options.version ?? '1.0.0',
  author: options.author ?? 'ASIS',
  description: options.description ?? '',
  permissions: options.permissions ?? ['api:query'],
  hooks: options.hooks ?? [],
  engines: options.engines ?? [],
});
