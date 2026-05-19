/**
 * ASIS LIVE SYSTEM — GENERATE + ACTIVATE
 */

import { asisEngine } from './asis-engine'
import { kernelLiveRegistry } from '../registry/kernel-live-registry'

export class ASISLive {

  async createAndActivate(spec: { id: string; name: string }) {

    const result = asisEngine.generateApp(spec)

    // register instantly in live system
    kernelLiveRegistry.register(spec.id)

    return {
      ...result,
      live: true
    }
  }
}

export const asisLive = new ASISLive()
