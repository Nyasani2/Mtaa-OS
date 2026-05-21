/**
 * MTAA OS — Kernel Boot Sequence
 * Single entry point for system startup
 */

import { kernelRegistry } from '../registry/kernel-registry'
import { KernelEventSystem } from '../events/kernel-event-system'

export class KernelBootSequence {

  private booted = false

  async boot() {
    if (this.booted) return
    this.booted = true

    console.log('🧠 MTAA OS BOOT SEQUENCE STARTING...')

    try {
      // 1. Event system bootstrap
      console.log('📡 Booting Event System...')
      const eventBus = KernelEventSystem.getInstance({
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      })

      await eventBus.boot()

      // 2. Mount all apps
      console.log('📦 Mounting apps...')
      await kernelRegistry.mountAll()

      // 3. System ready event
      eventBus.publish({
        domain: 'kernel',
        type: 'kernel.boot.complete',
        payload: { status: 'ready' },
        priority: 'critical',
        sourceModule: 'boot-sequence'
      })

      console.log('✅ MTAA OS BOOT COMPLETE')

    } catch (err) {
      console.error('❌ BOOT FAILURE:', err)

      // fail-safe event
      try {
        const eventBus = KernelEventSystem.getInstance()
        eventBus.publish({
          domain: 'kernel',
          type: 'kernel.boot.failed',
          payload: { error: String(err) },
          priority: 'critical',
          sourceModule: 'boot-sequence'
        })
      } catch {}
    }
  }
}

export const kernelBootSequence = new KernelBootSequence()
