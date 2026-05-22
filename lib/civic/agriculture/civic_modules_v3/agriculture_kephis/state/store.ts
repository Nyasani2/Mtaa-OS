"use client";

import { create } from "zustand";
import {
  AgricultureState,
  CropCertificate,
  SeedLicense,
  FarmInspection,
  PestDiseaseReport,
  AgriApplication,
  MarketPrice,
} from "../types";

export const useAgricultureStore = create<AgricultureState>((set, get) => ({
  certificates: [],
  seedLicenses: [],
  inspections: [],
  pestReports: [],
  applications: [],
  marketPrices: [],
  selectedItem: null,
  isLoading: false,
  error: null,
  filters: {},

  setCertificates: (certificates: CropCertificate[]) => set({ certificates }),
  setSeedLicenses: (seedLicenses: SeedLicense[]) => set({ seedLicenses }),
  setInspections: (inspections: FarmInspection[]) => set({ inspections }),
  setPestReports: (pestReports: PestDiseaseReport[]) => set({ pestReports }),
  setApplications: (applications: AgriApplication[]) => set({ applications }),
  setMarketPrices: (marketPrices: MarketPrice[]) => set({ marketPrices }),

  setSelectedItem: (item: any | null) => set({ selectedItem: item }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  setFilters: (filters: Partial<AgricultureState["filters"]>) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  clearError: () => set({ error: null }),
  reset: () =>
    set({
      certificates: [],
      seedLicenses: [],
      inspections: [],
      pestReports: [],
      applications: [],
      marketPrices: [],
      selectedItem: null,
      isLoading: false,
      error: null,
      filters: {},
    }),
}));
