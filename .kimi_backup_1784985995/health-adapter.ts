export interface HealthAdapter {
  getPatientRecords: (patientId: string) => Promise<any[]>;
  createAppointment: (data: any) => Promise<boolean>;
}

export const healthAdapter: HealthAdapter = {
  async getPatientRecords(patientId: string) {
    console.warn('HealthAdapter.getPatientRecords not implemented');
    return [];
  },
  async createAppointment(data: any) {
    console.warn('HealthAdapter.createAppointment not implemented');
    return false;
  },
};
