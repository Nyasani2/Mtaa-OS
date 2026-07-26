// MTAA PROPERTY OS — PROPERTY HOOK
// Bridge between store and UI components

import { useCallback } from "react";
import { usePropertyStore } from "../state/propertyStore";
import type { PropertySearchFilters, PropertyBooking, Lease, MaintenanceTicket } from "../types";

export function useProperty() {
  const store = usePropertyStore();

  const refreshProperties = useCallback(
    (filters?: PropertySearchFilters) => store.fetchProperties(filters),
    [store.fetchProperties]
  );

  const refreshProperty = useCallback(
    (id: string) => store.fetchPropertyById(id),
    [store.fetchPropertyById]
  );

  const search = useCallback(
    (term: string) => store.searchProperties(term),
    [store.searchProperties]
  );

  const book = useCallback(
    (booking: Partial<PropertyBooking>) => store.createBooking(booking),
    [store.createBooking]
  );

  const createLease = useCallback(
    (lease: Partial<Lease>) => store.createLease(lease),
    [store.createLease]
  );

  const reportMaintenance = useCallback(
    (ticket: Partial<MaintenanceTicket>) => store.createTicket(ticket),
    [store.createTicket]
  );

  return {
    // State
    properties: store.properties,
    currentProperty: store.currentProperty,
    searchResults: store.searchResults,
    searchFilters: store.searchFilters,
    bookings: store.bookings,
    currentBooking: store.currentBooking,
    leases: store.leases,
    currentLease: store.currentLease,
    maintenanceTickets: store.maintenanceTickets,
    notifications: store.notifications,
    savedProperties: store.savedProperties,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    refreshProperties,
    refreshProperty,
    search,
    setSearchFilters: store.setSearchFilters,
    saveProperty: store.saveProperty,
    unsaveProperty: store.unsaveProperty,
    fetchSavedProperties: store.fetchSavedProperties,
    book,
    confirmBooking: store.confirmBooking,
    cancelBooking: store.cancelBooking,
    fetchGuestBookings: store.fetchGuestBookings,
    fetchHostBookings: store.fetchHostBookings,
    createLease,
    signLease: store.signLease,
    terminateLease: store.terminateLease,
    fetchTenantLeases: store.fetchTenantLeases,
    fetchLandlordLeases: store.fetchLandlordLeases,
    reportMaintenance,
    assignContractor: store.assignContractor,
    updateTicketStatus: store.updateTicketStatus,
    fetchTenantTickets: store.fetchTenantTickets,
    fetchLandlordTickets: store.fetchLandlordTickets,
    reset: store.reset,
  };
}
