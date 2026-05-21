'use client';
import { useQuery } from '@tanstack/react-query';
import { ProviderService } from '../services/provider.service';

export function useProviders(filters?: { specialty?: string; verified?: boolean; telemedicine?: boolean }) {
  return useQuery({ queryKey: ['health', 'providers', filters], queryFn: () => ProviderService.getProviders(filters) });
}
export function useProvider(id: string) {
  return useQuery({ queryKey: ['health', 'provider', id], queryFn: () => ProviderService.getProvider(id), enabled: !!id });
}
export function useFacilities(filters?: { type?: string; emergency?: boolean }) {
  return useQuery({ queryKey: ['health', 'facilities', filters], queryFn: () => ProviderService.getFacilities(filters) });
}
