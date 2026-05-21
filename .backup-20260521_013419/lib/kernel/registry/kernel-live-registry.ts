/**
 * MTAA OS — LIVE REGISTRY STATE
 * In-memory app activation system (NO Metro involvement)
 */

export type LiveApp = {
  id: string
  status: 'active' | 'inactive' | 'error'
}

class KernelLiveRegistry {
  private apps = new Map<string, LiveApp>()

  register(id: string) {
    this.apps.set(id, { id, status: 'active' })
  }

  deactivate(id: string) {
    const app = this.apps.get(id)
    if (app) this.apps.set(id, { ...app, status: 'inactive' })
  }

  list() {
    return Array.from(this.apps.values())
  }

  get(id: string) {
    return this.apps.get(id)
  }
}

export const kernelLiveRegistry = new KernelLiveRegistry()
