"use client";

import { create } from "zustand";
import {
  TransportState,
  DrivingLicense,
  VehicleRegistration,
  InspectionRecord,
  TrafficOffence,
  NTSAApplication,
  RoadIncident,
} from "../types";

export const useTransportStore = create<TransportState>((set, get) => ({
  licenses: [],
  vehicles: [],
  inspections: [],
  offences: [],
  applications: [],
  incidents: [],
  selectedItem: null,
  isLoading: false,
  error: null,
  filters: {},

  setLicenses: (licenses: DrivingLicense[]) => set({ licenses }),
  setVehicles: (vehicles: VehicleRegistration[]) => set({ vehicles }),
  setInspections: (inspections: InspectionRecord[]) => set({ inspections }),
  setOffences: (offences: TrafficOffence[]) => set({ offences }),
  setApplications: (applications: NTSAApplication[]) => set({ applications }),
  setIncidents: (incidents: RoadIncident[]) => set({ incidents }),

  setSelectedItem: (item: any | null) => set({ selectedItem: item }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  setFilters: (filters: Partial<TransportState["filters"]>) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  clearError: () => set({ error: null }),
  reset: () =>
    set({
      licenses: [],
      vehicles: [],
      inspections: [],
      offences: [],
      applications: [],
      incidents: [],
      selectedItem: null,
      isLoading: false,
      error: null,
      filters: {},
    }),
}));
