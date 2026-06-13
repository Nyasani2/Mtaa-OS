/**
 * ASIS Wallet Layer — Interfaces
 * Required by: transfer-orchestrator.ts, fraud-monitor.ts
 */

import { Transfer, TransferPreview, FeeBreakdown } from './types'

export interface IPaymentRouteProvider {
  name: string
  method: string
  health(): Promise<{ available: boolean; latency: number; message?: string }>
  estimateFees(transfer: Transfer): Promise<FeeBreakdown>
  estimateCompletion(transfer: Transfer): Promise<Date>
  execute(transfer: Transfer): Promise<{ success: boolean; reference?: string; message?: string }>
  validateDestination(destination: any): Promise<{ valid: boolean; errors: string[] }>
}

export interface ITransactionValidator {
  validate(transfer: Transfer): Promise<{ valid: boolean; errors: string[]; warnings: string[] }>
  validateAmount(amount: number, currency: string): { valid: boolean; error?: string }
  validateKyc(userId: string, requiredLevel: number): Promise<{ valid: boolean; currentLevel: number }>
}

export interface IComplianceReporter {
  generateReport(period: { start: Date; end: Date }): Promise<ComplianceReport>
  flagTransaction(transactionId: string, reason: string): Promise<void>
  getFlaggedTransactions(): Promise<FlaggedTransaction[]>
}

export interface ComplianceReport {
  period: { start: Date; end: Date }
  totalVolume: number
  totalTransactions: number
  flaggedCount: number
  suspiciousAmount: number
  riskDistribution: Record<string, number>
  generatedAt: Date
}

export interface FlaggedTransaction {
  id: string
  transactionId: string
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'under_review' | 'resolved' | 'false_positive'
  flaggedAt: Date
  resolvedAt?: Date
  resolvedBy?: string
  notes?: string
}
