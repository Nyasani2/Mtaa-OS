import { useQuery } from "@tanstack/react-query";
import { PatientService } from "../services/patient.service";

export function useHealthPatient(id: string) {
  return useQuery({ queryKey: ["health", "patient", id], queryFn: async () => {
    const patientData = await PatientService.getPatientByUserId(id);
    if (!patientData) return null;
    const [records, appointments, labTests] = await Promise.all([
      PatientService.getPatientRecords(patientData.id),
      PatientService.getPatientAppointments(patientData.id),
      PatientService.getPatientLabTests(patientData.id),
    ]);
    return { ...patientData, records, appointments, labTests };
  }, enabled: !!id });
}
