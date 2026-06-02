// asis/deployment/adapters/web-adapter.ts
// Browser integration layer

class WebAdapter {
  private serviceWorker: ServiceWorkerRegistration | null = null;

  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorker = await navigator.serviceWorker.register('/asis-sw.js');
        console.log('[ASIS] Service worker registered');
      } catch (err) {
        console.warn('[ASIS] Service worker registration failed:', err);
      }
    }

    // Handle online/offline
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());
  }

  private onOnline() {
    const bus = (globalThis as any).__ASIS_EVENT_BUS__;
    bus?.emit?.('network.online', {});
  }

  private onOffline() {
    const bus = (globalThis as any).__ASIS_EVENT_BUS__;
    bus?.emit?.('network.offline', {});
  }

  async cacheAssets(assets: string[]): Promise<void> {
    if (!this.serviceWorker) return;
    // Would message service worker to cache assets
  }
}

export const webAdapter = new WebAdapter();
