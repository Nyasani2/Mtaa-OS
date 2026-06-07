/**
 * MTAA System Bus — Kernel Adapter
 * Bridges kernelEventBus → systemEventBus
 */

import { kernelEventBus } from '@/lib/kernel/kernel-event-bus'
import { systemEventBus, MTAAEventType } from '../event-bus'

const KERNEL_EVENT_MAP: Record<string, MTAAEventType> = {
  'kernel:init': 'kernel:boot:complete',
  'kernel:health': 'kernel:health:updated',
  'kernel:error': 'system:error:detected',
  'kernel:ready': 'kernel:boot:completed',
  'kernel:shutdown': 'kernel:boot:shutdown',
}

class KernelAdapter {
  private active = false
  private unsubs: (() => void)[] = []

  activate(): void {
    if (this.active) return
    this.active = true

    // Forward kernel events → system bus
    for (const [kernelEvent, systemEvent] of Object.entries(KERNEL_EVENT_MAP)) {
      const unsub = kernelEventBus.on(kernelEvent, (data) => {
        systemEventBus.emit(systemEvent, data, {
          source: 'kernel-adapter',
          priority: kernelEvent.includes('error') ? 'high' : 'normal',
        })
      })
      this.unsubs.push(unsub)
    }

    // Forward system bus kernel events → kernel event bus
    const systemUnsub = systemEventBus.on('kernel:**', (event) => {
      if (event.source === 'kernel-adapter') return
      const reverseMap = Object.fromEntries(
        Object.entries(KERNEL_EVENT_MAP).map(([k, v]) => [v, k])
      )
      const kernelEvent = reverseMap[event.type]
      if (kernelEvent) kernelEventBus.emit(kernelEvent, event.payload)
    })
    this.unsubs.push(systemUnsub)

    // Adapter event logged via kernel observability
  }

  deactivate(): void {
    this.unsubs.forEach(unsub => unsub())
    this.unsubs = []
    this.active = false
    // Adapter event logged via kernel observability
  }

  get isActive(): boolean { return this.active }
}

export const kernelAdapter = new KernelAdapter()

