// MTAA PROPERTY OS — PROPERTY STORE (Zustand)

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PropertyState, Property, PropertySearchFilters, PropertyBooking, Lease, MaintenanceTicket, PropertyNotification } from "../types";
import { propertyService } from "../services/propertyService";
import { bookingService } from "../services/bookingService";
import { leaseService } from "../services/leaseService";
import { maintenanceService } from "../services/maintenanceService";

interface PropertyStore extends PropertyState {
  // Actions
  setProperties: (properties: Property[]) => void;
  setCurrentProperty: (property: Property | null) => void;
  setSearchFilters: (filters: PropertySearchFilters) => void;
  setSearchResults: (results: Property[]) => void;
  setBookings: (bookings: PropertyBooking[]) => void;
  setCurrentBooking: (booking: PropertyBooking | null) => void;
  setLeases: (leases: Lease[]) => void;
  setCurrentLease: (lease: Lease | null) => void;
  setMaintenanceTickets: (tickets: MaintenanceTicket[]) => void;
  setNotifications: (notifications: PropertyNotification[]) => void;
  setSavedProperties: (properties: Property[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions
  fetchProperties: (filters?: PropertySearchFilters) => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  searchProperties: (term: string) => Promise<void>;
  fetchFeatured: () => Promise<void>;
  saveProperty: (userId: string, propertyId: string) => Promise<void>;
  unsaveProperty: (userId: string, propertyId: string) => Promise<void>;
  fetchSavedProperties: (userId: string) => Promise<void>;

  // Booking
  fetchGuestBookings: (guestId: string) => Promise<void>;
  fetchHostBookings: (hostId: string) => Promise<void>;
  createBooking: (booking: Partial<PropertyBooking>) => Promise<void>;
  confirmBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string, reason: string, byHost: boolean) => Promise<void>;

  // Lease
  fetchTenantLeases: (tenantId: string) => Promise<void>;
  fetchLandlordLeases: (landlordId: string) => Promise<void>;
  createLease: (lease: Partial<Lease>) => Promise<void>;
  signLease: (id: string, role: "tenant" | "landlord") => Promise<void>;
  terminateLease: (id: string, reason: string) => Promise<void>;

  // Maintenance
  fetchTenantTickets: (tenantId: string) => Promise<void>;
  fetchLandlordTickets: (landlordId: string) => Promise<void>;
  createTicket: (ticket: Partial<MaintenanceTicket>) => Promise<void>;
  assignContractor: (ticketId: string, contractorId: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: string) => Promise<void>;

  // Reset
  reset: () => void;
}

const initialState: PropertyState = {
  properties: [],
  currentProperty: null,
  bookings: [],
  currentBooking: null,
  leases: [],
  currentLease: null,
  maintenanceTickets: [],
  notifications: [],
  searchResults: [],
  searchFilters: {},
  savedProperties: [],
  analytics: [],
  isLoading: false,
  error: null,
};

export const usePropertyStore = create<PropertyStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProperties: (properties) => set({ properties }),
      setCurrentProperty: (currentProperty) => set({ currentProperty }),
      setSearchFilters: (searchFilters) => set({ searchFilters }),
      setSearchResults: (searchResults) => set({ searchResults }),
      setBookings: (bookings) => set({ bookings }),
      setCurrentBooking: (currentBooking) => set({ currentBooking }),
      setLeases: (leases) => set({ leases }),
      setCurrentLease: (currentLease) => set({ currentLease }),
      setMaintenanceTickets: (maintenanceTickets) => set({ maintenanceTickets }),
      setNotifications: (notifications) => set({ notifications }),
      setSavedProperties: (savedProperties) => set({ savedProperties }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Properties
      fetchProperties: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const properties = await propertyService.getProperties(filters);
          set({ properties, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchPropertyById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const property = await propertyService.getPropertyById(id);
          set({ currentProperty: property, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      searchProperties: async (term) => {
        set({ isLoading: true, error: null });
        try {
          const searchResults = await propertyService.searchProperties(term);
          set({ searchResults, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchFeatured: async () => {
        set({ isLoading: true, error: null });
        try {
          const properties = await propertyService.getFeaturedProperties();
          set({ properties, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      saveProperty: async (userId, propertyId) => {
        try {
          await propertyService.saveProperty(userId, propertyId);
          const saved = get().savedProperties;
          const property = get().properties.find((p) => p.id === propertyId);
          if (property) set({ savedProperties: [...saved, property] });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      unsaveProperty: async (userId, propertyId) => {
        try {
          await propertyService.unsaveProperty(userId, propertyId);
          set({ savedProperties: get().savedProperties.filter((p) => p.id !== propertyId) });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      fetchSavedProperties: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const savedProperties = await propertyService.getSavedProperties(userId);
          set({ savedProperties, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      // Bookings
      fetchGuestBookings: async (guestId) => {
        set({ isLoading: true, error: null });
        try {
          const bookings = await bookingService.getGuestBookings(guestId);
          set({ bookings, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchHostBookings: async (hostId) => {
        set({ isLoading: true, error: null });
        try {
          const bookings = await bookingService.getHostBookings(hostId);
          set({ bookings, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      createBooking: async (booking) => {
        set({ isLoading: true, error: null });
        try {
          await bookingService.createBooking(booking);
          set({ isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      confirmBooking: async (id) => {
        try {
          await bookingService.confirmBooking(id);
          set({
            bookings: get().bookings.map((b) =>
              b.id === id ? { ...b, booking_status: "confirmed" as const } : b
            ),
          });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      cancelBooking: async (id, reason, byHost) => {
        try {
          await bookingService.cancelBooking(id, reason, byHost);
          set({
            bookings: get().bookings.map((b) =>
              b.id === id
                ? { ...b, booking_status: byHost ? "cancelled_by_host" : "cancelled_by_guest", cancellation_reason: reason }
                : b
            ),
          });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      // Leases
      fetchTenantLeases: async (tenantId) => {
        set({ isLoading: true, error: null });
        try {
          const leases = await leaseService.getTenantLeases(tenantId);
          set({ leases, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchLandlordLeases: async (landlordId) => {
        set({ isLoading: true, error: null });
        try {
          const leases = await leaseService.getLandlordLeases(landlordId);
          set({ leases, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      createLease: async (lease) => {
        set({ isLoading: true, error: null });
        try {
          await leaseService.createLease(lease);
          set({ isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      signLease: async (id, role) => {
        try {
          await leaseService.signLease(id, role);
          set({
            leases: get().leases.map((l) =>
              l.id === id
                ? { ...l, [role === "tenant" ? "signed_by_tenant_at" : "signed_by_landlord_at"]: new Date().toISOString() }
                : l
            ),
          });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      terminateLease: async (id, reason) => {
        try {
          await leaseService.terminateLease(id, reason);
          set({
            leases: get().leases.map((l) =>
              l.id === id ? { ...l, status: "terminated" as const, termination_reason: reason } : l
            ),
          });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      // Maintenance
      fetchTenantTickets: async (tenantId) => {
        set({ isLoading: true, error: null });
        try {
          const maintenanceTickets = await maintenanceService.getTenantTickets(tenantId);
          set({ maintenanceTickets, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchLandlordTickets: async (landlordId) => {
        set({ isLoading: true, error: null });
        try {
          const maintenanceTickets = await maintenanceService.getLandlordTickets(landlordId);
          set({ maintenanceTickets, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      createTicket: async (ticket) => {
        set({ isLoading: true, error: null });
        try {
          await maintenanceService.createTicket(ticket);
          set({ isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      assignContractor: async (ticketId, contractorId) => {
        try {
          await maintenanceService.assignContractor(ticketId, contractorId);
          set({
            maintenanceTickets: get().maintenanceTickets.map((t) =>
              t.id === ticketId ? { ...t, contractor_id: contractorId, status: "assigned" as const } : t
            ),
          });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      updateTicketStatus: async (ticketId, status) => {
        try {
          await maintenanceService.updateStatus(ticketId, status);
          set({
            maintenanceTickets: get().maintenanceTickets.map((t) =>
              t.id === ticketId ? { ...t, status: status as MaintenanceTicket["status"] } : t
            ),
          });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: "property-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        searchFilters: state.searchFilters,
        savedProperties: state.savedProperties,
      }),
    }
  )
);
