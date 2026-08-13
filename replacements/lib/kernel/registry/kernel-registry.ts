import type { AppManifest } from '@/types/module.types';

export interface KernelRegistryEntry {
  id: string;
  manifest: AppManifest;
  status: 'active' | 'inactive' | 'error';
  errorCount: number;
  lastActive: number;
}

export class KernelRegistry {
  private entries: Map<string, KernelRegistryEntry> = new Map();

  register(manifest: AppManifest): KernelRegistryEntry {
    const entry: KernelRegistryEntry = {
      id: manifest.id,
      manifest,
      status: 'active',
      errorCount: 0,
      lastActive: Date.now(),
    };
    this.entries.set(manifest.id, entry);
    return entry;
  }

  getEntry(id: string): KernelRegistryEntry | undefined {
    return this.entries.get(id);
  }

  reportError(id: string) {
    const entry = this.entries.get(id);
    if (!entry) return;
    entry.status = 'error';
    entry.errorCount += 1;
  }

  activate(id: string) {
    const entry = this.entries.get(id);
    if (!entry) return;
    entry.status = 'active';
    entry.lastActive = Date.now();
  }
}

export const kernelRegistry = new KernelRegistry();
