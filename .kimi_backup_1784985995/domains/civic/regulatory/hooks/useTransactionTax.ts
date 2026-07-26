import { useCallback } from 'react';
import { calculateWithholding, type WithholdingPayload } from '../services/withholdingService';

/**
 * Hook to automatically withhold tax on every platform transaction.
 * Call this in the payment completion flow of MTaxi, MTruck, Boda, Shop, Restaurant.
 * 
 * Usage in MTaxi payment flow:
 *   const { withholdTax } = useTransactionTax();
 *   await withholdTax({
 *     transactionId: ride.id,
 *     transactionType: 'mtaxi_ride',
 *     taxpayerId: ride.driver_id,
 *     baseAmount: ride.driver_earnings,
 *     jurisdictionCode: ride.jurisdiction_code || 'KE',
 *   });
 */
export function useTransactionTax() {
  const withholdTax = useCallback(async (payload: WithholdingPayload) => {
    // Skip if amount is too small
    if (payload.baseAmount < 1) {
      return { skipped: true, reason: 'amount_below_threshold' };
    }

    const result = await calculateWithholding(payload);
    return {
      skipped: false,
      withholdingId: result.withholdingId,
      amount: result.amount,
      taxRate: result.taxRate,
      currency: result.currency,
    };
  }, []);

  return { withholdTax };
}
