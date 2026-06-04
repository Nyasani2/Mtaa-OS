/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MTAA OS — SYSTEM EVENT BUS (Master)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The CENTRAL NERVOUS SYSTEM of MTAA.
 * Replaces: kernelEventBus, walletEventBus, ASIS EventBus
 * 
 * All subsystems (kernel, wallet, ASIS, civic) route through this bus.
 * Pattern: domain:action:entity
 */

export type MTAAEventNamespace = 
  | 'wallet' | 'kernel' | 'asis' | 'civic' | 'system'
  | 'auth' | 'notification' | 'health' | 'transport' | 'marketplace'

export type MTAAEventAction =
  | 'transfer' | 'balance' | 'transaction' | 'deposit' | 'withdrawal'
  | 'boot' | 'init' | 'shutdown' | 'error' | 'health'
  | 'fraud' | 'intelligence' | 'orchestrator'
  | 'permit' | 'license' | 'report'
  | 'login' | 'logout' | 'session'
  | 'send' | 'receive'
  | 'ride' | 'delivery'
  | 'listing' | 'order'

export type MTAAEventEntity =
  | 'initiated' | 'completed' | 'failed' | 'updated' | 'created'
  | 'deleted' | 'approved' | 'rejected' | 'detected' | 'flagged'
  | 'resolved' | 'expired' | 'verified' | 'locked' | 'unlocked'

export type MTAAEventType = 
  | `${MTAAEventNamespace}:${MTAAEventAction}:${MTAAEventEntity}`
  | `${MTAAEventNamespace}:${MTAAEventAction}`
  | string

export interface MTAAEvent<T = any> {
  id: string
  type: MTAAEventType
  namespace: MTAAEventNamespace
  action: MTAAEventAction
  entity: MTAAEventEntity
  payload: T
  timestamp: number
  source: string
  correlationId?: string
  userId?: string
  sessionId?: string
  priority: 'low' | 'normal' | 'high' | 'critical'
}

export type MTAAEventHandler<T = any> = (event: MTAAEvent<T>) => void | Promise<void>
export type EventMiddleware = (event: MTAAEvent, next: () => void | Promise<void>) => void | Promise<void>

class MTAASystemEventBus {
  private listeners: Map<string, Set<MTAAEventHandler>> = new Map()
  private history: MTAAEvent[] = []
  private middleware: EventMiddleware[] = []
  private _initialized = false

  initialize(): void {
    if (this._initialized) return
    this._initialized = true
    console.log('[MTAA System Bus] Initialized')
    this.emit('system:boot:complete', { version: '2.0.0', timestamp: Date.now() }, { source: 'system' })
  }

  get isInitialized(): boolean { return this._initialized }

  use(mw: EventMiddleware): () => void {
    this.middleware.push(mw)
    return () => {
      const i = this.middleware.indexOf(mw)
      if (i > -1) this.middleware.splice(i, 1)
    }
  }

  on<T = any>(eventType: MTAAEventType | MTAAEventType[], handler: MTAAEventHandler<T>): () => void {
    const types = Array.isArray(eventType) ? eventType : [eventType]
    const unsubs: (() => void)[] = []
    for (const type of types) {
      const key = type.toLowerCase().trim()
      if (!this.listeners.has(key)) this.listeners.set(key, new Set())
      this.listeners.get(key)!.add(handler)
      unsubs.push(() => this.listeners.get(key)?.delete(handler))
    }
    return () => unsubs.forEach(u => u())
  }

  once<T = any>(eventType: MTAAEventType, handler: MTAAEventHandler<T>): () => void {
    const unsub = this.on(eventType, (event) => { handler(event); unsub() })
    return unsub
  }

  emit<T = any>(type: MTAAEventType, payload: T, options?: {
    source?: string; correlationId?: string; userId?: string; sessionId?: string; priority?: MTAAEvent['priority']
  }): void {
    if (!this._initialized) { console.warn('[MTAA System Bus] Not initialized'); return }
    const parts = type.split(':')
    const event: MTAAEvent<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type, namespace: (parts[0] || 'system') as MTAAEventNamespace,
      action: (parts[1] || 'unknown') as MTAAEventAction,
      entity: (parts[2] || 'updated') as MTAAEventEntity,
      payload, timestamp: Date.now(),
      source: options?.source || 'unknown',
      correlationId: options?.correlationId,
      userId: options?.userId, sessionId: options?.sessionId,
      priority: options?.priority || 'normal',
    }
    this.history.push(event)
    if (this.history.length > 2000) this.history.shift()
    this.executeMiddleware(event, () => this.broadcast(event))
  }

  private broadcast<T>(event: MTAAEvent<T>): void {
    const handlers = new Set<MTAAEventHandler>()
    const exactKey = event.type.toLowerCase().trim()
    this.listeners.get(exactKey)?.forEach(h => handlers.add(h))
    for (const [key, listeners] of this.listeners.entries()) {
      if (this.matchesWildcard(key, event.type)) listeners.forEach(h => handlers.add(h))
    }
    for (const handler of handlers) {
      try {
        const result = handler(event)
        if (result instanceof Promise) result.catch(err => console.error(err))
      } catch (err) { console.error(`[MTAA Bus] Handler error for ${event.type}:`, err) }
    }
  }

  private async executeMiddleware(event: MTAAEvent, finalAction: () => void): Promise<void> {
    let index = 0
    const next = async () => {
      if (index < this.middleware.length) {
        const mw = this.middleware[index++]
        try { const r = mw(event, next); if (r instanceof Promise) await r }
        catch (e) { console.error(e) }
      } else { finalAction() }
    }
    await next()
  }

  private matchesWildcard(pattern: string, eventType: string): boolean {
    if (!pattern.includes('*')) return false
    const pp = pattern.split(':'); const ep = eventType.split(':')
    for (let i = 0; i < pp.length; i++) {
      if (pp[i] === '**') return true
      if (pp[i] === '*') continue
      if (pp[i] !== ep[i]) return false
    }
    return pp.length === ep.length
  }

  getHistory(options?: { limit?: number; type?: MTAAEventType; namespace?: MTAAEventNamespace; since?: number }): MTAAEvent[] {
    let filtered = [...this.history]
    if (options?.type) filtered = filtered.filter(e => e.type === options.type)
    if (options?.namespace) filtered = filtered.filter(e => e.namespace === options.namespace)
    if (options?.since) filtered = filtered.filter(e => e.timestamp >= options.since)
    return filtered.slice(-(options?.limit || 50))
  }

  replay(options?: { type?: MTAAEventType; namespace?: MTAAEventNamespace; since?: number; limit?: number }): void {
    this.getHistory(options).forEach(e => this.broadcast(e))
  }

  hasListeners(type: MTAAEventType): boolean {
    const key = type.toLowerCase().trim()
    if (this.listeners.get(key)?.size) return true
    for (const [pattern] of this.listeners.keys()) if (this.matchesWildcard(pattern, type)) return true
    return false
  }

  reset(): void { this.listeners.clear(); this.history = []; this.middleware = []; this._initialized = false }
}

export const systemEventBus = new MTAASystemEventBus()
