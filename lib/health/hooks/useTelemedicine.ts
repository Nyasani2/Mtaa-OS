import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TelemedicineService } from "../services/telemedicine.service";

export function useTelemedicineSession(sessionId: string) {
  return useQuery({ queryKey: ["health", "telemedicine", sessionId], queryFn: () => TelemedicineService.getSession(sessionId), enabled: !!sessionId, refetchInterval: 5000 });
}
export function useStartTelemedicineSession() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: TelemedicineService.startSession, onSuccess: (d: any) => qc.invalidateQueries({ queryKey: ["health", "telemedicine", d?.id] }) });
}
export function useEndTelemedicineSession() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: TelemedicineService.endSession, onSuccess: () => qc.invalidateQueries({ queryKey: ["health", "telemedicine"] }) });
}
