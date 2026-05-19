import { KernelEventSystem } from '../events/kernel-event-system';
import { KernelRegistry } from '../registry/kernel-registry';

export class KernelBootSequence {

  private booted = false

  async boot() {
    if (this.booted) return
    this.booted = true

    console.log('🧠 MTAA OS BOOT SEQUENCE STARTING...')

    try {
      console.log('📡 Booting Event System...')

      const eventBus = KernelEventSystem.getInstance?.() || new KernelEventSystem()

      await eventBus?.boot()

      console.log('📦 Mounting apps...')

      const registry = KernelRegistry.getInstance()

      // safe no-op if mountAll doesn't exist yet
      if ((registry as any).mountAll) {
        await (registry as any).mountAll()
      }

      eventBus.emit({
        domain: 'kernel',
        type: 'kernel.boot.complete',
        payload: { status: 'ready' },
      })

      console.log('✅ MTAA OS BOOT COMPLETE')

    } catch (err) {
      console.error('❌ BOOT FAILURE:', err)

      try {
        const eventBus = new KernelEventSystem()
        eventBus.emit({
          domain: 'kernel',
          type: 'kernel.boot.failed',
          payload: { error: String(err) },
        })
      } catch {}
    }
  }
}

export const kernelBootSequence = new KernelBootSequence();
