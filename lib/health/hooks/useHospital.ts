import { useQuery } from "@tanstack/react-query";
import { HospitalService } from "../services/hospital.service";

export function useHospitals() {
  return useQuery({ queryKey: ["health", "hospitals"], queryFn: () => HospitalService.getHospitals() });
}
export function useDepartments(hospitalId: string) {
  return useQuery({ queryKey: ["health", "departments", hospitalId], queryFn: () => HospitalService.getDepartments(hospitalId), enabled: !!hospitalId });
}
export function useBeds(departmentId: string) {
  return useQuery({ queryKey: ["health", "beds", departmentId], queryFn: () => HospitalService.getBeds(departmentId), enabled: !!departmentId });
}
export function useAlerts(hospitalId: string) {
  return useQuery({ queryKey: ["health", "alerts", hospitalId], queryFn: () => HospitalService.getAlerts(hospitalId), enabled: !!hospitalId });
}
