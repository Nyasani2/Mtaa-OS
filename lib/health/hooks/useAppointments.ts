import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppointmentService } from "../services/appointment.service";
import type { HealthAppointment } from "../types";

export function useAppointments(userId: string, role: string) {
  return useQuery({ queryKey: ["health", "appointments", userId, role], queryFn: () => AppointmentService.getAppointments(userId, role), enabled: !!userId });
}
export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: AppointmentService.book, onSuccess: () => qc.invalidateQueries({ queryKey: ["health", "appointments"] }) });
}
export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: HealthAppointment["status"] }) => AppointmentService.updateStatus(id, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["health", "appointments"] }) });
}
