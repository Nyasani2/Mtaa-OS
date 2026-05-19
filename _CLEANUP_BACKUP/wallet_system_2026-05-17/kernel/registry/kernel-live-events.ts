/**
 * MTAA OS — LIVE KERNEL EVENTS
 */

import { kernelLiveRegistry } from './kernel-live-registry'

type Listener = (state: any) => void

class LiveEventBus {
  private listeners: Listener[] = []

  subscribe(fn: Listener) {
    this.listeners.push(fn)
  }

  emit() {
    const state = kernelLiveRegistry.list()
    this.listeners.forEach(fn => fn(state))
  }

  refresh() {
    this.emit()
  }
}

export const liveEventBus = new LiveEventBus()
