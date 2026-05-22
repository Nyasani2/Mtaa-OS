import { create } from 'zustand';
import { VehicleRegistration, DrivingLicense, InspectionRecord, Sacco, TrafficOffence, NTSAApplication, RoadIncident } from '../types';

interface TransportState {
  vehicles: VehicleRegistration[];
  licenses: DrivingLicense[];
  inspections: InspectionRecord[];
  saccos: Sacco[];
  offences: TrafficOffence[];
  applications: NTSAApplication[];
  incidents: RoadIncident[];
  selectedItem: any;
  isLoading: boolean;
  error: string | null;
  setVehicles: (vehicles: VehicleRegistration[]) => void;
  setLicenses: (licenses: DrivingLicense[]) => void;
  setInspections: (inspections: InspectionRecord[]) => void;
  setSaccos: (saccos: Sacco[]) => void;
  setOffences: (offences: TrafficOffence[]) => void;
  setApplications: (applications: NTSAApplication[]) => void;
  setIncidents: (incidents: RoadIncident[]) => void;
  setSelectedItem: (item: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useTransportStore = create<TransportState>((set) => ({
  vehicles: [],
  licenses: [],
  inspections: [],
  saccos: [],
  offences: [],
  applications: [],
  incidents: [],
  selectedItem: null,
  isLoading: false,
  error: null,
  setVehicles: (vehicles) => set({ vehicles }),
  setLicenses: (licenses) => set({ licenses }),
  setInspections: (inspections) => set({ inspections }),
  setSaccos: (saccos) => set({ saccos }),
  setOffences: (offences) => set({ offences }),
  setApplications: (applications) => set({ applications }),
  setIncidents: (incidents) => set({ incidents }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
