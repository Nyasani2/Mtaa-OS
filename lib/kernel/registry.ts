// lib/kernel/registry.ts
import { AppManifest } from '@/types/module.types';

const registry = new Map<string, AppManifest>();

export function registerApp(manifest: AppManifest): void {
  registry.set(manifest.id, manifest);
}

export function getAppById(id: string): AppManifest | undefined {
  return registry.get(id);
}

export function listApps(): AppManifest[] {
  return Array.from(registry.values());
}

export function isSystemApp(id: string): boolean {
  return registry.get(id)?.isSystemApp ?? false;
}

export function isLocalApp(id: string): boolean {
  return registry.get(id)?.isLocalApp ?? false;
}

export function unregisterApp(id: string): boolean {
  return registry.delete(id);
}

export function clearRegistry(): void {
  registry.clear();
}
