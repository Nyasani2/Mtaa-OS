import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAmbulanceDispatches, getDispatchDetail, createDispatch, handoverDispatch } from "@/lib/health/services/ambulance.service";

export function useAmbulanceDispatches(filter: string) {
  return useQuery({ queryKey: ["ambulance-dispatches", filter], queryFn: () => getAmbulanceDispatches(filter) });
}
export function useDispatchDetail(dispatchId: string) {
  return useQuery({ queryKey: ["dispatch-detail", dispatchId], queryFn: () => getDispatchDetail(dispatchId), enabled: !!dispatchId });
}
export function useCreateDispatch() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createDispatch, onSuccess: () => qc.invalidateQueries({ queryKey: ["ambulance-dispatches"] }) });
}
export function useHandoverDispatch() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: handoverDispatch, onSuccess: () => { qc.invalidateQueries({ queryKey: ["ambulance-dispatches"] }); qc.invalidateQueries({ queryKey: ["dispatch-detail"] }); } });
}
