import { useCallback } from 'react';
import { calculateWithholding } from '../services/withholdingService';

/**
 * Hook for shop and restaurant sales tax withholding.
 * Call when order is marked as completed/paid.
 */
export function useCommerceTax() {
  const withholdCommerceTax = useCallback(async ({
    orderId,
    merchantId,
    orderTotal,
    jurisdictionCode = 'KE',
    transactionType = 'shop_sale',
  }: {
    orderId: string;
    merchantId: string;
    orderTotal: number;
    jurisdictionCode?: string;
    transactionType?: 'shop_sale' | 'restaurant_order';
  }) => {
    if (orderTotal < 1) return { skipped: true };

    return await calculateWithholding({
      transactionId: orderId,
      transactionType,
      taxpayerId: merchantId,
      baseAmount: orderTotal,
      jurisdictionCode,
    });
  }, []);

  return { withholdCommerceTax };
}
