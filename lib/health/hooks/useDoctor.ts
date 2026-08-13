import { useQuery } from '@tanstack/react-query';
import { usePaginatedQuery } from './usePaginatedQuery';
import { getDoctorDashboard, getTodayAppointments, getPendingOrders, createPrescription, getDoctorOrders, getFollowUps, getLabOrders, getDoctorNotes, createNote, signNote } from '@/lib/health/services/doctor.service';
export function useDoctorDashboard(doctorId: string | null) { return useQuery({ queryKey: ['doctor-dashboard', doctorId], queryFn: () => getDoctorDashboard(doctorId!), enabled: !!doctorId }); }
export function useTodayAppointments(doctorId: string | null) { return usePaginatedQuery(['today-appointments', doctorId], (range) => getTodayAppointments(doctorId!, range), { enabled: !!doctorId }); }
export function usePendingOrders(doctorId: string | null) { return usePaginatedQuery(['pending-orders', doctorId], (range) => getPendingOrders(doctorId!, range), { enabled: !!doctorId }); }
export function useCreatePrescription() { return { mutateAsync: createPrescription }; }
export function useDoctorOrders(doctorId: string | null) { return usePaginatedQuery(['doctor-orders', doctorId], (range) => getDoctorOrders(doctorId!, range), { enabled: !!doctorId }); }
export function useFollowUps(doctorId: string | null) { return usePaginatedQuery(['doctor-followups', doctorId], (range) => getFollowUps(doctorId!, range), { enabled: !!doctorId }); }
export function useLabOrders(doctorId: string | null) { return usePaginatedQuery(['doctor-lab-orders', doctorId], (range) => getLabOrders(doctorId!, range), { enabled: !!doctorId }); }
export function useDoctorNotes(doctorId: string | null, filter?: string) { return usePaginatedQuery(['doctor-notes', doctorId, filter], (range) => getDoctorNotes(doctorId!, filter, range), { enabled: !!doctorId }); }
export function useCreateNote() { return { mutateAsync: createNote }; }
export function useSignNote() { return { mutateAsync: signNote }; }
