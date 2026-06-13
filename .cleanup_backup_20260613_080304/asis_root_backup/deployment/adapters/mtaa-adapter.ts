// asis/deployment/adapters/mtaa-adapter.ts
// Integrates ASIS into MTAA OS

import { integrationLayer } from '../integration-layer';
import { systemLoader } from '../system-loader';

class MTAAAdapter {
  private mounted = false;

  async mount(): Promise<boolean> {
    if (this.mounted) return true;

    // Register ASIS as MTAA system module
    const mtaa = (globalThis as any).__MTAA_OS__;
    if (!mtaa) {
      console.warn('[ASIS] MTAA OS not detected — running standalone');
      return false;
    }

    // Register bridge
    integrationLayer.registerBridge({
      app: 'appstore',
      send: async (event, payload) => {
        mtaa.dispatch?.({ source: 'asis', event, payload });
      },
      receive: (event, handler) => {
        const unsub = mtaa.subscribe?.('asis', event, handler);
        return unsub || (() => {});
      },
    });

    // Expose ASIS status to MTAA dashboard
    mtaa.registerSystem?.('asis', {
      getStatus: () => systemLoader.getStatus(),
      version: (globalThis as any).__ASIS_VERSION__,
    });

    this.mounted = true;
    console.log('[ASIS] MTAA adapter mounted');
    return true;
  }

  async unmount(): Promise<void> {
    this.mounted = false;
  }
}

export const mtaaAdapter = new MTAAAdapter();
