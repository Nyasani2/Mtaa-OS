import { create } from 'zustand';

interface HealthState {
  patients: any[];
  appointments: any[];
  prescriptions: any[];
  loading: boolean;
  setPatients: (p: any[]) => void;
  setAppointments: (a: any[]) => void;
  setLoading: (l: boolean) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  patients: [],
  appointments: [],
  prescriptions: [],
  loading: false,
  setPatients: (patients) => set({ patients }),
  setAppointments: (appointments) => set({ appointments }),
  setLoading: (loading) => set({ loading }),
}));
