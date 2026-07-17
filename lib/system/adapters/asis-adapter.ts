/**
 * MTAA System Bus — ASIS Adapter
 * Bridges ASIS layer → systemEventBus
 * 
 * FIXED 2026-07-16: Removed broken imports for non-existent modules.
 * Fraud monitoring, transfer orchestration, and transaction intelligence
 * are DISABLED until the modules are built.
 */

import { systemEventBus, MTAAEventType } from '../event-bus'

// DISABLED: Modules not yet built. Import when ready:
// import { FraudMonitor } from '@/asis/wallet/fraud-monitor'
// import { TransferOrchestrator } from '@/asis/wallet/transfer-orchestrator'
// import { TransactionIntelligence } from '@/asis/wallet/transaction-intelligence'
// import { WalletAssistant } from '@/asis/wallet/wallet-assistant'
// import { TransactionValidator } from '@/asis/wallet/security/transaction-validator'
// import { TransferPolicy } from '@/asis/wallet/security/transfer-policy'

class ASISAdapter {
  private active = false
  private unsubs: (() => void)[] = []

  activate(): void {
    if (this.active) return
    this.active = true
    this.wireListeners()
    console.log('[ASIS Adapter] Activated — intelligence layer wired to System Bus')
  }

  private wireListeners(): void {
    // Wire ASIS intelligence to system bus events
    // TODO: Wire fraud monitor when implemented
    // TODO: Wire transfer orchestrator when implemented
    // TODO: Wire transaction intelligence when implemented
  }

  deactivate(): void {
    this.unsubs.forEach((unsub) => unsub())
    this.unsubs = []
    this.active = false
    console.log('[ASIS Adapter] Deactivated')
  }
}

export const asisAdapter = new ASISAdapter()
