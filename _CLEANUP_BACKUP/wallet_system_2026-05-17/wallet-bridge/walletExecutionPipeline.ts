/**
 * MTAA OS — Wallet Execution Pipeline
 * -----------------------------------
 * Central execution pipeline for ALL wallet actions.
 *
 * Flow:
 * UI
 * → Security Layer
 * → Security Engine
 * → Executor
 * → Event Bus
 * → UI Reactive Updates
 */

import { walletSecurityLayer } from './walletSecurityLayer'
import { walletSecurityEngine } from './walletSecurityEngine'
import { walletTransactionExecutor } from './walletTransactionExecutor'
import { walletEventBus } from './walletEventBus'

type ExecuteInput = {
  type:
    | 'SEND_MONEY'
    | 'TOPUP_MPESA'
    | 'TOPUP_CARD'
    | 'TRANSFER'
    | 'CREATE_WALLET'

  userId: string
  amount?: number
  currency?: string
  recipientId?: string
  metadata?: any
}

class WalletExecutionPipeline {
  async execute(input: ExecuteInput) {
    try {
      /**
       * STEP 1 — POLICY SECURITY
       */
      const policyDecision = walletSecurityLayer.evaluate({
        userId: input.userId,
        action: input.type as any,
        amount: input.amount,
        metadata: input.metadata,
      })

      if (policyDecision === 'BLOCK') {
        throw new Error('Blocked by wallet security layer')
      }

      /**
       * STEP 2 — LOW LEVEL SECURITY
       */
      const secure = walletSecurityEngine.guardTransaction({
        id: `${input.type}_${Date.now()}`,
        userId: input.userId,
        amount: input.amount,
        type: input.type,
        currency: input.currency,
      })

      if (!secure) {
        throw new Error('Security engine rejected transaction')
      }

      /**
       * STEP 3 — EXECUTION
       */
      const result =
        await walletTransactionExecutor.execute(input)

      /**
       * STEP 4 — SUCCESS EVENT
       */
      walletEventBus.emit(
        'TRANSACTION_CONFIRMED',
        result,
        'walletExecutionPipeline'
      )

      return result
    } catch (err: any) {
      walletEventBus.emit(
        'TRANSACTION_FAILED',
        {
          reason: err?.message || 'Execution failed',
          input,
        },
        'walletExecutionPipeline'
      )

      throw err
    }
  }
}

export const walletExecutionPipeline =
  new WalletExecutionPipeline()
