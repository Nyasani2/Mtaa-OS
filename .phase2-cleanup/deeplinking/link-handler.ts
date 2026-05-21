// lib/mtaa/deeplinking/link-handler.ts
import { router } from 'expo-router';
import { unifiedRegistry } from '@/lib/mtaa/appstore/unified-registry';

export interface DeepLink { scheme: string; host: string; path: string; params: Record<string, string>; }

class LinkHandler {
  private handlers = new Map<string, (link: DeepLink) => void>();
  register(scheme: string, handler: (link: DeepLink) => void): void { this.handlers.set(scheme, handler); }

  process(url: string): void {
    const link = this.parse(url); if (!link) return;
    const manifest = unifiedRegistry.getApp(link.host);
    if (manifest) router.push(manifest.entryRoute as any);
    const handler = this.handlers.get(link.scheme);
    if (handler) handler(link);
  }

  private parse(url: string): DeepLink|null {
    try {
      const parsed = new URL(url);
      const params: Record<string, string> = {};
      parsed.searchParams.forEach((v, k) => { params[k] = v; });
      return { scheme: parsed.protocol.replace(':', ''), host: parsed.hostname, path: parsed.pathname, params };
    } catch { return null; }
  }
}
export const linkHandler = new LinkHandler();
