// lib/kernel/registry/kernel-registry.ts
import { AppManifest, KernelRegistryEntry } from '@/types/module.types';

const kernelRegistry = new Map<string, KernelRegistryEntry>();

export function registerKernelApp(manifest: AppManifest): KernelRegistryEntry {
  const entry: KernelRegistryEntry = {
    id: manifest.id,
    manifest,
    status: 'active',
    lastBooted: new Date().toISOString(),
    errorCount: 0,
  };
  kernelRegistry.set(manifest.id, entry);
  return entry;
}

export function getKernelEntry(id: string): KernelRegistryEntry | undefined {
  return kernelRegistry.get(id);
}

export function listKernelEntries(): KernelRegistryEntry[] {
  return Array.from(kernelRegistry.values());
}

export function setKernelError(id: string, error: string): void {
  const entry = kernelRegistry.get(id);
  if (entry) {
    entry.status = 'error';
    entry.errorCount += 1;
  }
}

export function setKernelActive(id: string): void {
  const entry = kernelRegistry.get(id);
  if (entry) {
    entry.status = 'active';
    entry.lastBooted = new Date().toISOString();
  }
}
