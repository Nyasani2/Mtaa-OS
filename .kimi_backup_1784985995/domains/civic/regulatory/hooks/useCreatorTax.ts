import { useCallback } from 'react';
import { calculateWithholding } from '../services/withholdingService';

/**
 * Hook for creator earnings tax withholding.
 * Call when disbursing creator earnings (Streets, Pulse, etc.)
 */
export function useCreatorTax() {
  const withholdCreatorTax = useCallback(async ({
    earningsId,
    creatorId,
    amount,
    jurisdictionCode = 'KE',
  }: {
    earningsId: string;
    creatorId: string;
    amount: number;
    jurisdictionCode?: string;
  }) => {
    if (amount < 1) return { skipped: true };

    return await calculateWithholding({
      transactionId: earningsId,
      transactionType: 'creator_earning',
      taxpayerId: creatorId,
      baseAmount: amount,
      jurisdictionCode,
    });
  }, []);

  return { withholdCreatorTax };
}
