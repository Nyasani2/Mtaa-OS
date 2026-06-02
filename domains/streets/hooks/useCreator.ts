import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorService } from '../services/creatorService';
import type { CreatorDashboard, SubscriptionTier, MonetizationSettings } from '../types';

export function useCreator() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscribers' | 'earnings' | 'content'>('overview');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['streets', 'creator', 'dashboard'],
    queryFn: () => creatorService.getDashboard(),
  });

  const { data: subscribers } = useQuery({
    queryKey: ['streets', 'creator', 'subscribers'],
    queryFn: () => creatorService.getSubscribers(),
  });

  const { data: earnings } = useQuery({
    queryKey: ['streets', 'creator', 'earnings'],
    queryFn: () => creatorService.getEarnings(),
  });

  const updateTiers = useMutation({
    mutationFn: (tiers: SubscriptionTier[]) => creatorService.updateSubscriptionTiers(tiers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'creator'] });
    },
  });

  const updateMonetization = useMutation({
    mutationFn: (settings: Partial<MonetizationSettings>) =>
      creatorService.updateMonetizationSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'creator'] });
    },
  });

  const withdrawEarnings = useMutation({
    mutationFn: (amount: number) => creatorService.withdrawEarnings(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'creator', 'earnings'] });
    },
  });

  return {
    dashboard,
    subscribers,
    earnings,
    isLoading,
    activeTab,
    setActiveTab,
    updateTiers,
    updateMonetization,
    withdrawEarnings,
  };
}
