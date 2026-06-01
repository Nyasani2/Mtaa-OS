import { create } from 'zustand';
import type { HeavyEquipment, EquipmentBooking, HeavyEquipmentType } from '@/lib/mtruck/types';
import { heavyEquipmentService } from '@/lib/mtruck/services/heavy-equipment-service';

interface HeavyEquipmentState {
  equipment: HeavyEquipment[];
  bookings: EquipmentBooking[];
  selectedEquipment: HeavyEquipment | null;
  summary: Record<HeavyEquipmentType, number>;
  isLoading: boolean;
  error: string | null;

  loadEquipment: (filters?: Parameters<typeof heavyEquipmentService.getAvailableEquipment>[0]) => Promise<void>;
  loadBookings: (requesterId: string) => Promise<void>;
  loadSummary: () => Promise<void>;
  selectEquipment: (eq: HeavyEquipment | null) => void;
  bookEquipment: (data: {
    equipmentId: string;
    requesterId: string;
    jobId?: string;
    startDate: string;
    endDate: string;
    hoursPerDay: number;
    operatorIncluded: boolean;
    deliveryLocation: { lat: number; lng: number; address: string };
  }) => Promise<EquipmentBooking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  clearError: () => void;
}

export const useHeavyEquipmentStore = create<HeavyEquipmentState>((set) => ({
  equipment: [],
  bookings: [],
  selectedEquipment: null,
  summary: {} as Record<HeavyEquipmentType, number>,
  isLoading: false,
  error: null,

  loadEquipment: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const equipment = await heavyEquipmentService.getAvailableEquipment(filters);
      set({ equipment, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  loadBookings: async (requesterId) => {
    set({ isLoading: true, error: null });
    try {
      const bookings = await heavyEquipmentService.getMyBookings(requesterId);
      set({ bookings, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  loadSummary: async () => {
    try {
      const summary = await heavyEquipmentService.getEquipmentSummary();
      set({ summary });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  selectEquipment: (eq) => set({ selectedEquipment: eq }),

  bookEquipment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const booking = await heavyEquipmentService.bookEquipment(data);
      set((state) => ({
        bookings: [booking, ...state.bookings],
        isLoading: false,
      }));
      return booking;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  cancelBooking: async (bookingId) => {
    set({ isLoading: true, error: null });
    try {
      await heavyEquipmentService.cancelBooking(bookingId);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
        ),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
