import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HealthState {
  activeTab: string; selectedProviderId: string | null; selectedAppointmentId: string | null; selectedRecordId: string | null;
  cart: { medicationId: string; quantity: number; name: string; price: number }[];
  setActiveTab: (tab: string) => void; setSelectedProvider: (id: string | null) => void;
  setSelectedAppointment: (id: string | null) => void; setSelectedRecord: (id: string | null) => void;
  addToCart: (item: { medicationId: string; quantity: number; name: string; price: number }) => void;
  removeFromCart: (medicationId: string) => void; clearCart: () => void;
}

export const useHealthStore = create<HealthState>()(persist((set, get) => ({
  activeTab: 'dashboard', selectedProviderId: null, selectedAppointmentId: null, selectedRecordId: null, cart: [],
  setActiveTab: (tab) => set({ activeTab: tab }), setSelectedProvider: (id) => set({ selectedProviderId: id }),
  setSelectedAppointment: (id) => set({ selectedAppointmentId: id }), setSelectedRecord: (id) => set({ selectedRecordId: id }),
  addToCart: (item) => set({ cart: [...get().cart, item] }), removeFromCart: (mid) => set({ cart: get().cart.filter((i: any) => i.medicationId !== mid) }), clearCart: () => set({ cart: [] }),
}), { name: 'health-store' }));
