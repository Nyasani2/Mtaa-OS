import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PharmacyService } from "../services/pharmacy.service";

export function usePharmacies(filters?: any) {
  return useQuery({ queryKey: ["health", "pharmacies", filters], queryFn: () => PharmacyService.getPharmacies(filters) });
}
export function useMedications(pharmacyId: string) {
  return useQuery({ queryKey: ["health", "medications", pharmacyId], queryFn: () => PharmacyService.getMedications(pharmacyId) });
}
export function useSearchMedications(query: string) {
  return useQuery({ queryKey: ["health", "medications", "search", query], queryFn: () => PharmacyService.searchMedications(query), enabled: query.length > 2 });
}
export function usePharmacyOrders(patientId: string) {
  return useQuery({ queryKey: ["health", "orders", patientId], queryFn: () => PharmacyService.getOrders(patientId), enabled: !!patientId });
}
export function useCreatePharmacyOrder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: PharmacyService.createOrder, onSuccess: () => qc.invalidateQueries({ queryKey: ["health", "orders"] }) });
}
