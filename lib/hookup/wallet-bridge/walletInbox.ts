/**
 * MTAA OS — Wallet Inbox System
 * -----------------------------
 * Each app gets its own event inbox.
 * Wallet uses this instead of global clutter.
 */

import { walletEventBus, WalletEvent } from './walletEventBus';

type InboxMessage = {
  id: string
  type: string
  payload: any
  read: boolean
  timestamp: number
}

class WalletInbox {
  private messages: InboxMessage[] = []

  constructor() {
    walletEventBus.on((event: WalletEvent) => {
      this.push(event)
    })
  }

  push(event: WalletEvent) {
    this.messages.unshift({
      id: Math.random().toString(36).substring(2),
      type: event.type,
      payload: event.payload,
      read: false,
      timestamp: event.timestamp || Date.now(),
    })
  }

  getAll() {
    return this.messages
  }

  getUnread() {
    return this.messages.filter((m) => !m.read)
  }

  markRead(id: string) {
    this.messages = this.messages.map((m) =>
      m.id === id ? { ...m, read: true } : m
    )
  }

  clear() {
    this.messages = []
  }
}

export const walletInbox = new WalletInbox()

