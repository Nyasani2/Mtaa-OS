import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services/walletService';
import type { WalletTransaction, WalletTopUpInput } from '../types';

export function useWallet() {
  const queryClient = useQueryClient();
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  const { data: balance, isLoading } = useQuery({
    queryKey: ['streets', 'wallet', 'balance'],
    queryFn: () => walletService.getBalance(),
  });

  const { data: transactions } = useQuery({
    queryKey: ['streets', 'wallet', 'transactions'],
    queryFn: () => walletService.getTransactions(),
  });

  const topUp = useMutation({
    mutationFn: (input: WalletTopUpInput) => walletService.topUp(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'wallet'] });
      setShowTopUp(false);
      setTopUpAmount('');
    },
  });

  const sendTip = useMutation({
    mutationFn: ({ recipientId, amount, message }: { recipientId: string; amount: number; message?: string }) =>
      walletService.sendTip(recipientId, amount, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'wallet'] });
    },
  });

  const withdraw = useMutation({
    mutationFn: (amount: number) => walletService.withdraw(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'wallet'] });
    },
  });

  return {
    balance,
    transactions,
    isLoading,
    showTopUp,
    setShowTopUp,
    topUpAmount,
    setTopUpAmount,
    topUp,
    sendTip,
    withdraw,
  };
}
