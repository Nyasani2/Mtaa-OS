// MTAA STAY OS — STAY STORE (Zustand)

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StayState, StayListing, StaySearchFilters, StayBooking, Lease, MaintenanceTicket, StayNotification } from "../types";
import { stayService } from "../services/stayService";
import { bookingService } from "../services/bookingService";
import { leaseService } from "../services/leaseService";
import { maintenanceService } from "../services/maintenanceService";

interface StayStore extends StayState {
  setListings: (listings: StayListing[]) => void;
  setCurrentListing: (listing: StayListing | null) => void;
  setSearchFilters: (filters: StaySearchFilters) => void;
  setSearchResults: (results: StayListing[]) => void;
  setBookings: (bookings: StayBooking[]) => void;
  setCurrentBooking: (booking: StayBooking | null) => void;
  setLeases: (leases: Lease[]) => void;
  setCurrentLease: (lease: Lease | null) => void;
  setMaintenanceTickets: (tickets: MaintenanceTicket[]) => void;
  setNotifications: (notifications: StayNotification[]) => void;
  setSavedListings: (listings: StayListing[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchListings: (filters?: StaySearchFilters) => Promise<void>;
  fetchListingById: (id: string) => Promise<void>;
  searchListings: (term: string) => Promise<void>;
  fetchFeatured: () => Promise<void>;
  saveListing: (userId: string, propertyId: string) => Promise<void>;
  unsaveListing: (userId: string, propertyId: string) => Promise<void>;
  fetchSavedListings: (userId: string) => Promise<void>;

  fetchGuestBookings: (guestId: string) => Promise<void>;
  fetchHostBookings: (hostId: string) => Promise<void>;
  createBooking: (booking: Partial<StayBooking>) => Promise<void>;
  confirmBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string, reason: string, byHost: boolean) => Promise<void>;

  fetchTenantLeases: (tenantId: string) => Promise<void>;
  fetchLandlordLeases: (landlordId: string) => Promise<void>;
  createLease: (lease: Partial<Lease>) => Promise<void>;
  signLease: (id: string, role: "tenant" | "landlord") => Promise<void>;
  terminateLease: (id: string, reason: string) => Promise<void>;

  fetchTenantTickets: (tenantId: string) => Promise<void>;
  fetchLandlordTickets: (landlordId: string) => Promise<void>;
  createTicket: (ticket: Partial<MaintenanceTicket>) => Promise<void>;
  assignContractor: (ticketId: string, contractorId: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: string) => Promise<void>;

  reset: () => void;
}

const initialState: StayState = {
  listings: [],
  currentListing: null,
  bookings: [],
  currentBooking: null,
  leases: [],
  currentLease: null,
  maintenanceTickets: [],
  notifications: [],
  searchResults: [],
  searchFilters: {},
  savedListings: [],
  analytics: [],
  isLoading: false,
  error: null,
};

export const useStayStore = create<StayStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setListings: (listings) => set({ listings }),
      setCurrentListing: (currentListing) => set({ currentListing }),
      setSearchFilters: (searchFilters) => set({ searchFilters }),
      setSearchResults: (searchResults) => set({ searchResults }),
      setBookings: (bookings) => set({ bookings }),
      setCurrentBooking: (currentBooking) => set({ currentBooking }),
      setLeases: (leases) => set({ leases }),
      setCurrentLease: (currentLease) => set({ currentLease }),
      setMaintenanceTickets: (maintenanceTickets) => set({ maintenanceTickets }),
      setNotifications: (notifications) => set({ notifications }),
      setSavedListings: (savedListings) => set({ savedListings }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchListings: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const listings = await stayService.getListings(filters);
          set({ listings, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchListingById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const listing = await stayService.getListingById(id);
          set({ currentListing: listing, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      searchListings: async (term) => {
        set({ isLoading: true, error: null });
        try {
          const searchResults = await stayService.searchListings(term);
          set({ searchResults, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchFeatured: async () => {
        set({ isLoading: true, error: null });
        try {
          const listings = await stayService.getFeaturedListings();
          set({ listings, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      saveListing: async (userId, propertyId) => {
        try {
          await stayService.saveListing(userId, propertyId);
          const saved = get().savedListings;
          const listing = get().listings.find((p) => p.id === propertyId);
          if (listing) set({ savedListings: [...saved, listing] });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      unsaveListing: async (userId, propertyId) => {
        try {
          await stayService.unsaveListing(userId, propertyId);
          set({ savedListings: get().savedListings.filter((p) => p.id !== propertyId) });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      fetchSavedListings: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const savedListings = await stayService.getSavedListings(userId);
          set({ savedListings, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

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
      name: "stay-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        searchFilters: state.searchFilters,
        savedListings: state.savedListings,
      }),
    }
  )
);

// Legacy alias
export const usePropertyStore = useStayStore;
