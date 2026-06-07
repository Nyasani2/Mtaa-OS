import { create } from 'zustand';

interface ShipperState {
  shipments: any[];
  requests: any[];
  jobs: any[];
  activeShipment: any | null;
  activeJob: any | null;
  isLoading: boolean;
  error: string | null;
  setActiveShipment: (s: any) => void;
  addShipment: (s: any) => void;
  loadRequests: (userId: string) => Promise<void>;
  loadJobs: (userId: string) => Promise<void>;
  trackJob: (jobId: string) => Promise<void>;
  createRequest: (data: any) => Promise<void>;
  clearError: () => void;
}

export const useShipperStore = create<ShipperState>((set) => ({
  shipments: [],
  requests: [],
  jobs: [],
  activeShipment: null,
  activeJob: null,
  isLoading: false,
  error: null,
  setActiveShipment: (activeShipment) => set({ activeShipment }),
  addShipment: (shipment) => set((state) => ({ shipments: [...state.shipments, shipment] })),
  loadRequests: async () => set({ isLoading: true, error: null }),
  loadJobs: async () => set({ isLoading: false }),
  trackJob: async () => set({ isLoading: false }),
  createRequest: async () => set({ isLoading: false }),
  clearError: () => set({ error: null }),
}));

export default useShipperStore;
