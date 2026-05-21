
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConversions, createConversion, getQuote } from '../services/conversionService';
import { getBinanceLink } from '../services/binanceLinkService';

export function useBinanceConversions(userId: string) {
  return useQuery({
    queryKey: ['binance-conversions', userId],
    queryFn: () => getConversions(userId),
    enabled: !!userId,
  });
}

export function useBinanceLink(userId: string) {
  return useQuery({
    queryKey: ['binance-link', userId],
    queryFn: () => getBinanceLink(userId),
    enabled: !!userId,
  });
}

export function useConversionQuote() {
  return useMutation({
    mutationFn: ({ amount, from, to }: { amount: number; from?: string; to?: string }) =>
      getQuote(amount, from, to),
  });
}

export function useCreateConversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConversion,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['binance-conversions', vars.userId] }),
  });
}
