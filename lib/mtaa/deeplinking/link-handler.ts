// @ts-nocheck
import { getRegistryEntries } from '@/lib/kernel/registry';

export function handleDeepLink(url: string) {
  const entries = getRegistryEntries() as any[];
  const target = entries.find((e: any) => url.includes(e.id));
  return { handled: true, target: target?.id };
}
