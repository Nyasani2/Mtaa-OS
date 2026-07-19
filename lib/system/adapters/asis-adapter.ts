/**
 * MTAA System Bus — ASIS Adapter
 * Bridges ASIS layer → systemEventBus
 * Wires fraud monitor, transfer orchestrator, transaction intelligence.
 *
 * RE-ENABLED 2026-07-17: The fraud/transfer/intelligence modules referenced
 * here were previously missing entirely (imports pointed at non-existent
 * files, so this class had been disabled). Real, database-backed
 * implementations now exist at asis/wallet/* — see those files for their
 * documented scope and limitations. This adapter is currently NOT wired
 * into app startup (nothing calls activateAllAdapters()) — that remains
 * a deliberate choice pending a decision on when fraud monitoring should
 * go live, not an oversight.
 */

import { systemEventBus, MTAAEventType } from '../event-bus'
import { FraudMonitor } from '@/asis/wallet/fraud-monitor'
import { TransferOrchestrator } from '@/asis/wallet/transfer-orchestrator'
import { TransactionIntelligence } from '@/asis/wallet/transaction-intelligence'
import { WalletAssistant } from '@/asis/wallet/wallet-assistant'
import { TransactionValidator } from '@/asis/wallet/security/transaction-validator'
import { TransferPolicy } from '@/asis/wallet/security/transfer-policy'

class ASISAdapter {
  private active = false
  private fraudMonitor?: FraudMonitor
  private transferOrchestrator?: TransferOrchestrator
  private transactionIntelligence?: TransactionIntelligence
  private unsubs: (() => void)[] = []

  activate(): void {
    if (this.active) return
    this.active = true
    this.initFraudMonitor()
    this.initTransferOrchestrator()
    this.initTransactionIntelligence()
    this.wireListeners()
    console.log('[ASIS Adapter] Activated — intelligence layer wired to System Bus')
  }

  private makeBridgeBus(source: string) {
    return {
      on: (event: string, callback: (data: any) => void) => {
        const unsub = systemEventBus.on(event as MTAAEventType, (evt) => callback(evt.payload))
        this.unsubs.push(unsub)
        return unsub
      },
      emit: (event: string, data: any) => systemEventBus.emit(event as MTAAEventType, data, { source }),
    }
  }

  private initFraudMonitor(): void {
    this.fraudMonitor = new FraudMonitor(this.makeBridgeBus('asis-fraud'), {
      velocityWindowMinutes: 60,
      maxTransfersPerWindow: 10,
      maxAmountPerWindow: 100000,
      maxFailedPinAttempts: 3,
      maxDuplicateClaims: 2,
      geoMaxDistanceKm: 500,
    })
  }

  private initTransferOrchestrator(): void {
    this.transferOrchestrator = new TransferOrchestrator(
      new TransactionValidator(),
      new TransferPolicy(),
      new WalletAssistant(),
      this.makeBridgeBus('asis-orchestrator')
    )
  }

  private initTransactionIntelligence(): void {
    const bridgeMemory = { retrieve: async () => [] }
    this.transactionIntelligence = new TransactionIntelligence(
      new WalletAssistant(),
      bridgeMemory as any,
      this.makeBridgeBus('asis-intelligence')
    )
  }

  private wireListeners(): void {
    // Transfer → Fraud Analysis
    const transferUnsub = systemEventBus.on('wallet:transaction:created', async (event) => {
      if (this.fraudMonitor) {
        const result = await this.fraudMonitor.analyzeTransfer(event.payload)
        if (result.blocked || result.risk > 30) {
          systemEventBus.emit('asis:fraud:detected', {
            transactionId: event.payload.id,
            risk: result.risk,
            alerts: result.alerts,
            blocked: result.blocked,
            userId: event.payload.senderId,
          }, {
            source: 'asis-adapter',
            priority: result.blocked ? 'critical' : 'high',
            correlationId: event.correlationId,
          })
        }
      }
    })
    this.unsubs.push(transferUnsub)

    // Balance → Intelligence
    const balanceUnsub = systemEventBus.on('wallet:balance:updated', async (event) => {
      if (this.transactionIntelligence && event.payload?.userId) {
        const insights = await this.transactionIntelligence.generateInsights(event.payload.userId)
        if (insights.length > 0) {
          systemEventBus.emit('asis:intelligence:detected', {
            userId: event.payload.userId,
            insights,
          }, { source: 'asis-adapter' })
        }
      }
    })
    this.unsubs.push(balanceUnsub)

    // Fraud → Regulatory Flag
    const fraudUnsub = systemEventBus.on('asis:fraud:detected', (event) => {
      systemEventBus.emit('system:regulatory:flagged', {
        type: 'fraud',
        severity: event.payload.blocked ? 'critical' : 'high',
        userId: event.payload.userId,
        transactionId: event.payload.transactionId,
        riskScore: event.payload.risk,
        description: event.payload.alerts?.join('; ') || 'Fraud detected',
        evidence: event.payload,
      }, {
        source: 'asis-adapter',
        priority: event.payload.blocked ? 'critical' : 'high',
      })
    })
    this.unsubs.push(fraudUnsub)
  }

  getFraudMonitor(): FraudMonitor | undefined { return this.fraudMonitor }
  getTransferOrchestrator(): TransferOrchestrator | undefined { return this.transferOrchestrator }
  getTransactionIntelligence(): TransactionIntelligence | undefined { return this.transactionIntelligence }

  deactivate(): void {
    this.unsubs.forEach((unsub) => unsub())
    this.unsubs = []
    this.active = false
    console.log('[ASIS Adapter] Deactivated')
  }

  get isActive(): boolean { return this.active }
}

export const asisAdapter = new ASISAdapter()
