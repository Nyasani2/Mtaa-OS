import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletHealthService } from '@/lib/health/services/wallet-health.service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useWalletHealth() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: balance, isLoading } = useQuery({
    queryKey: ['wallet', 'balance', user?.id],
    queryFn: () => walletHealthService.getBalance(user!.id),
    enabled: !!user?.id,
  });

  const payMutation = useMutation({
    mutationFn: walletHealthService.processPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
    },
  });

  return {
    balance: balance ?? 0,
    isLoading,
    pay: payMutation.mutate,
    isPaying: payMutation.isPending,
    payError: payMutation.error,
  };
}

