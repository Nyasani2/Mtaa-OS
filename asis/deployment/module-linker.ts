// asis/deployment/module-linker.ts
// Connect ZIP modules 4–10, resolve cross-module dependencies

import { versionManager } from './version-manager';

export interface ModuleLink {
  source: string;
  target: string;
  type: 'dependency' | 'event' | 'api' | 'data';
  status: 'pending' | 'linked' | 'failed';
}

const DEPENDENCY_GRAPH: Record<string, string[]> = {
  'memory-core': [],
  'memory-advanced': ['memory-core'],
  'cognition-core': ['memory-core'],
  'cognition-advanced': ['cognition-core', 'memory-advanced'],
  'runtime-kernel': ['cognition-core', 'memory-core'],
  'agent-system': ['runtime-kernel', 'cognition-advanced'],
  'runtime-engine': ['runtime-kernel', 'agent-system'],
};

const INIT_ORDER = [
  'memory-core',
  'memory-advanced',
  'cognition-core',
  'cognition-advanced',
  'runtime-kernel',
  'agent-system',
  'runtime-engine',
];

class ModuleLinker {
  private links: ModuleLink[] = [];
  private linkedModules = new Set<string>();

  async link(modules: string[]): Promise<{
    linked: string[];
    failed: string[];
    order: string[];
  }> {
    const order = this.resolveInitOrder(modules);
    const linked: string[] = [];
    const failed: string[] = [];

    for (const mod of order) {
      try {
        await this.linkModule(mod);
        linked.push(mod);
      } catch (err: any) {
        failed.push(mod);
        console.error(`[ASIS Linker] Failed to link ${mod}:`, err);
      }
    }

    return { linked, failed, order };
  }

  private async linkModule(mod: string) {
    const deps = DEPENDENCY_GRAPH[mod] || [];
    for (const dep of deps) {
      if (!this.linkedModules.has(dep)) {
        throw new Error(`Dependency ${dep} not linked for ${mod}`);
      }
      this.links.push({
        source: mod,
        target: dep,
        type: 'dependency',
        status: 'linked',
      });
    }
    this.linkedModules.add(mod);
  }

  private resolveInitOrder(modules: string[]): string[] {
    return INIT_ORDER.filter(m => modules.includes(m));
  }

  async unlinkAll(): Promise<void> {
    this.links = [];
    this.linkedModules.clear();
  }

  getLinks(): ModuleLink[] {
    return [...this.links];
  }

  isLinked(mod: string): boolean {
    return this.linkedModules.has(mod);
  }
}

export const moduleLinker = new ModuleLinker();
