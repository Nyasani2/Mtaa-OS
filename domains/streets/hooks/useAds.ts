import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsService } from '../services/adsService';
import type { AdCampaign, AdBudget, AdTarget } from '../types';

export function useAds() {
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['streets', 'ads', 'campaigns'],
    queryFn: () => adsService.getCampaigns(),
  });

  const { data: analytics } = useQuery({
    queryKey: ['streets', 'ads', 'analytics', selectedCampaign],
    queryFn: () => selectedCampaign ? adsService.getCampaignAnalytics(selectedCampaign) : null,
    enabled: !!selectedCampaign,
  });

  const createCampaign = useMutation({
    mutationFn: (campaign: Omit<AdCampaign, 'id' | 'status'>) => adsService.createCampaign(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'ads', 'campaigns'] });
    },
  });

  const updateBudget = useMutation({
    mutationFn: ({ campaignId, budget }: { campaignId: string; budget: AdBudget }) =>
      adsService.updateBudget(campaignId, budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'ads'] });
    },
  });

  const pauseCampaign = useMutation({
    mutationFn: (campaignId: string) => adsService.pauseCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'ads', 'campaigns'] });
    },
  });

  const resumeCampaign = useMutation({
    mutationFn: (campaignId: string) => adsService.resumeCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'ads', 'campaigns'] });
    },
  });

  return {
    campaigns,
    analytics,
    isLoading,
    selectedCampaign,
    setSelectedCampaign,
    createCampaign,
    updateBudget,
    pauseCampaign,
    resumeCampaign,
  };
}
