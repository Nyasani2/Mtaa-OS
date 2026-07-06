import { usePaginatedQuery } from "./usePaginatedQuery";
import {
  getDoctorDashboard,
  getTodayAppointments,
  getPendingOrders,
  createPrescription,
  getDoctorOrders,
  getFollowUps,
  getLabOrders,
  getDoctorNotes,
  createNote,
  signNote,
} from "@/lib/health/services/doctor.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDoctorDashboard(doctorId: string) {
  return useQuery({ queryKey: ["doctor-dashboard", doctorId], queryFn: () => getDoctorDashboard(doctorId), enabled: !!doctorId });
}

export function useTodayAppointments(doctorId: string) {
  return usePaginatedQuery(["today-appointments", doctorId], (range) => getTodayAppointments(doctorId, range), { enabled: !!doctorId });
}

export function usePendingOrders(doctorId: string) {
  return usePaginatedQuery(["pending-orders", doctorId], (range) => getPendingOrders(doctorId, range), { enabled: !!doctorId });
}

export function useDoctorPrescribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPrescription,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pending-orders"] }); qc.invalidateQueries({ queryKey: ["doctor-dashboard"] }); },
  });
}

export function useDoctorOrders(doctorId: string) {
  return usePaginatedQuery(["doctor-orders", doctorId], (range) => getDoctorOrders(doctorId, range), { enabled: !!doctorId });
}

export function useDoctorFollowUps(doctorId: string) {
  return usePaginatedQuery(["doctor-followups", doctorId], (range) => getFollowUps(doctorId, range), { enabled: !!doctorId });
}

export function useDoctorLabOrders(doctorId: string) {
  return usePaginatedQuery(["doctor-lab-orders", doctorId], (range) => getLabOrders(doctorId, range), { enabled: !!doctorId });
}

export function useDoctorNotes(doctorId: string, filter: string) {
  return usePaginatedQuery(["doctor-notes", doctorId, filter], (range) => getDoctorNotes(doctorId, filter, range), { enabled: !!doctorId });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createNote, onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor-notes"] }) });
}

export function useSignNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: signNote, onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor-notes"] }) });
}
