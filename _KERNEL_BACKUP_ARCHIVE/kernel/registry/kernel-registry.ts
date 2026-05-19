/**
 * MTAA OS — Stable Kernel Registry (NO dynamic imports)
 */

import { KernelSandbox } from '../sandbox/kernel-sandbox'
import { APP_REGISTRY } from '../../../apps/runtime.registry'

export type MountedApp = {
  id: string
  status: 'mounted' | 'failed'
}

export class KernelRegistry {
  private apps = new Map<string, MountedApp>()

  async mountAll() {
    for (const app of APP_REGISTRY) {
      this.apps.set(app.id, {
        id: app.id,
        status: 'mounted'
      })
    }
  }

  getApps() {
    return Array.from(this.apps.values())
  }

  isMounted(id: string) {
    return this.apps.get(id)?.status === 'mounted'
  }
}

export const kernelRegistry = new KernelRegistry()
