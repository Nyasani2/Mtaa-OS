import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PatientService } from "../services/patient.service";
import type { HealthPatient } from "../types";

export function usePatient(userId: string) {
  return useQuery({ queryKey: ["health", "patient", userId], queryFn: () => PatientService.getProfile(userId), enabled: !!userId });
}
export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ userId, data }: { userId: string; data: Partial<HealthPatient> }) => PatientService.updateProfile(userId, data), onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["health", "patient", v.userId] }) });
}
