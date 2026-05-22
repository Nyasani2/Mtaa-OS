import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SymptomService } from "../services/symptom.service";

export function useSymptomHistory(patientId: string) {
  return useQuery({ queryKey: ["health", "symptoms", patientId], queryFn: () => SymptomService.getHistory(patientId), enabled: !!patientId });
}
export function useCheckSymptoms() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: SymptomService.checkSymptoms, onSuccess: () => qc.invalidateQueries({ queryKey: ["health", "symptoms"] }) });
}
