import { useQuery } from "@tanstack/react-query";
import { ProviderService } from "../services/provider.service";

export function useProviders(filters?: any) {
  return useQuery({ queryKey: ["health", "providers", filters], queryFn: () => ProviderService.getProviders(filters) });
}
export function useProvider(id: string) {
  return useQuery({ queryKey: ["health", "provider", id], queryFn: () => ProviderService.getProvider(id), enabled: !!id });
}
export function useFacilities(filters?: any) {
  return useQuery({ queryKey: ["health", "facilities", filters], queryFn: () => ProviderService.getFacilities(filters) });
}
