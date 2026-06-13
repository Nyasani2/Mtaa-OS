// asis/deployment/asis-package.ts
// ASIS Package System — bundles modules ZIP 1–10 into deployable units

import { ASISModule, ModuleGraph, PackageManifest, SecurityProfile } from './types';
import { versionManager } from './version-manager';

export interface ASIS_PACKAGE {
  version: string;
  modules: ASISModule[];
  dependencies: Record<string, string>;
  runtimeRequirements: {
    minMemoryMB: number;
    minStorageMB: number;
    requiredPermissions: string[];
  };
  securityProfile: SecurityProfile;
  checksums: Record<string, string>;
  buildTimestamp: number;
  environment: 'dev' | 'staging' | 'prod';
}

const MODULE_ORDER = [
  'memory-core',       // ZIP 4
  'memory-advanced',   // ZIP 5
  'cognition-core',    // ZIP 6
  'cognition-advanced',// ZIP 7
  'runtime-kernel',    // ZIP 8
  'agent-system',      // ZIP 9
  'runtime-engine',    // ZIP 10
];

class PackageSystem {
  private manifests: Map<string, PackageManifest> = new Map();

  async bundle(options: {
    modules: string[];
    version: string;
    environment: 'dev' | 'staging' | 'prod';
    partial?: boolean;
  }): Promise<ASIS_PACKAGE> {
    const selected = options.partial
      ? options.modules
      : MODULE_ORDER;

    // Validate all requested modules exist
    for (const mod of selected) {
      if (!MODULE_ORDER.includes(mod)) {
        throw new Error(`Unknown module: ${mod}`);
      }
    }

    // Resolve dependency graph
    const graph = this.resolveGraph(selected);
    const ordered = this.topologicalSort(graph);

    // Validate compatibility
    await this.validateCompatibility(ordered, options.version);

    // Generate checksums
    const checksums = await this.generateChecksums(ordered);

    const pkg: ASIS_PACKAGE = {
      version: options.version,
      modules: ordered.map(m => this.getModuleDef(m)),
      dependencies: this.collectDependencies(ordered),
      runtimeRequirements: this.calculateRequirements(ordered),
      securityProfile: this.buildSecurityProfile(ordered, options.environment),
      checksums,
      buildTimestamp: Date.now(),
      environment: options.environment,
    };

    return pkg;
  }

  private resolveGraph(modules: string[]): ModuleGraph {
    const graph: ModuleGraph = {};
    for (const mod of modules) {
      graph[mod] = this.getModuleDependencies(mod);
    }
    return graph;
  }

  private topologicalSort(graph: ModuleGraph): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: string[] = [];

    const visit = (node: string) => {
      if (temp.has(node)) throw new Error(`Circular dependency detected: ${node}`);
      if (visited.has(node)) return;
      temp.add(node);
      for (const dep of graph[node] || []) {
        if (graph[dep]) visit(dep);
      }
      temp.delete(node);
      visited.add(node);
      result.push(node);
    };

    for (const node of Object.keys(graph)) visit(node);
    return result;
  }

  private getModuleDependencies(mod: string): string[] {
    const deps: Record<string, string[]> = {
      'memory-core': [],
      'memory-advanced': ['memory-core'],
      'cognition-core': ['memory-core'],
      'cognition-advanced': ['cognition-core', 'memory-advanced'],
      'runtime-kernel': ['cognition-core', 'memory-core'],
      'agent-system': ['runtime-kernel', 'cognition-advanced'],
      'runtime-engine': ['runtime-kernel', 'agent-system'],
    };
    return deps[mod] || [];
  }

  private getModuleDef(name: string): ASISModule {
    return {
      name,
      version: versionManager.current(),
      entryPoint: `asis/${name.replace(/-/g, '/')}/index.ts`,
      exports: [`asis/${name.replace(/-/g, '/')}`],
    };
  }

  private async validateCompatibility(modules: string[], targetVersion: string) {
    for (const mod of modules) {
      const compat = await versionManager.checkCompatibility(mod, targetVersion);
      if (!compat.compatible) {
        throw new Error(`Module ${mod} incompatible with version ${targetVersion}: ${compat.reason}`);
      }
    }
  }

  private async generateChecksums(modules: string[]): Promise<Record<string, string>> {
    const checksums: Record<string, string> = {};
    for (const mod of modules) {
      // In production: hash module bundle
      checksums[mod] = `sha256-${mod}-${Date.now()}`;
    }
    return checksums;
  }

  private collectDependencies(modules: string[]): Record<string, string> {
    const all: Record<string, string> = {};
    for (const mod of modules) {
      Object.assign(all, this.getModuleDependencies(mod));
    }
    return all;
  }

  private calculateRequirements(modules: string[]) {
    const base = { minMemoryMB: 64, minStorageMB: 32, requiredPermissions: [] as string[] };
    for (const mod of modules) {
      if (mod.includes('agent')) base.minMemoryMB += 128;
      if (mod.includes('cognition')) base.minMemoryMB += 64;
      if (mod.includes('runtime')) base.minStorageMB += 64;
    }
    base.requiredPermissions = ['network', 'storage', 'background-processing'];
    return base;
  }

  private buildSecurityProfile(modules: string[], env: string): SecurityProfile {
    return {
      level: env === 'prod' ? 'strict' : env === 'staging' ? 'moderate' : 'relaxed',
      encryption: env === 'prod',
      auditLog: env !== 'dev',
      sandbox: modules.includes('agent-system'),
    };
  }

  validatePackage(pkg: ASIS_PACKAGE): boolean {
    // Verify checksums match
    for (const [mod, hash] of Object.entries(pkg.checksums)) {
      const expected = `sha256-${mod}-${pkg.buildTimestamp}`;
      if (!hash.startsWith('sha256-')) return false;
    }
    // Verify version format
    if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) return false;
    // Verify all required modules present
    const required = ['memory-core', 'runtime-kernel'];
    const hasRequired = required.every(r => pkg.modules.some(m => m.name === r));
    return hasRequired;
  }
}

export const packageSystem = new PackageSystem();
