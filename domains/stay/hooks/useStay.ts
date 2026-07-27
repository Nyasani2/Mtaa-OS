// domains/stay/hooks/useStay.ts
// Stay module hook for MTAA OS — FIXED table names to match schema
// Imported by: stay tabs, booking, lease, list-stay, maintenance, payment, [id]

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import type { StayListing, StayBooking, Lease, MaintenanceTicket } from '../types';

export function useStay() {
  const user = useAuthStore((s) => s.user);
  const [listings, setListings] = useState<StayListing[]>([]);
  const [myListings, setMyListings] = useState<StayListing[]>([]);
  const [bookings, setBookings] = useState<StayBooking[]>([]);
  const [myBookings, setMyBookings] = useState<StayBooking[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async (filters?: { type?: string; location?: string; maxPrice?: number }) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('properties').select('*').eq('status', 'active');
      if (filters?.type) query = query.eq('property_type', filters.type);
      if (filters?.location) query = query.or(`town.ilike.%${filters.location}%,county.ilike.%${filters.location}%,street.ilike.%${filters.location}%`);
      if (filters?.maxPrice) query = query.lte('price_per_night', filters.maxPrice);
      const { data, error: err } = await query.order('created_at', { ascending: false });
      if (err) throw err;
      setListings((data || []) as StayListing[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyListings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setMyListings((data || []) as StayListing[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchListing = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      if (err) throw err;
      return data as StayListing;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createListing = useCallback(async (listing: Partial<StayListing>) => {
    if (!user?.id) return null;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('properties')
        .insert({ ...listing, owner_id: user.id })
        .select()
        .single();
      if (err) throw err;
      const newListing = data as StayListing;
      setMyListings((prev) => [newListing, ...prev]);
      return newListing;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateListing = useCallback(async (id: string, updates: Partial<StayListing>) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (err) throw err;
      const updated = data as StayListing;
      setMyListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
      return updated;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteListing = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('properties').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      setMyListings((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = useCallback(async (booking: Partial<StayBooking>) => {
    if (!user?.id) return null;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('property_bookings')
        .insert({ ...booking, guest_id: user.id })
        .select()
        .single();
      if (err) throw err;
      return data as StayBooking;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchMyBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('property_bookings')
        .select('*, property:properties(title, cover_image)')
        .eq('guest_id', user.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setMyBookings((data || []) as StayBooking[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchBookingsForProperty = useCallback(async (propertyId: string) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('property_bookings')
        .select('*')
        .eq('property_id', propertyId)
        .order('check_in_date', { ascending: true });
      if (err) throw err;
      setBookings((data || []) as StayBooking[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBookingStatus = useCallback(async (bookingId: string, status: StayBooking['booking_status']) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('property_bookings')
        .update({ booking_status: status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select()
        .single();
      if (err) throw err;
      const updated = data as StayBooking;
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      setMyBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      return updated;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createLease = useCallback(async (lease: Partial<Lease>) => {
    if (!user?.id) return null;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('leases')
        .insert({ ...lease, landlord_id: user.id })
        .select()
        .single();
      if (err) throw err;
      return data as Lease;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchLeases = useCallback(async (propertyId?: string) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let query = supabase.from('leases').select('*, property:properties(title, cover_image)');
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        query = query.or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`);
      }
      const { data, error: err } = await query.order('created_at', { ascending: false });
      if (err) throw err;
      setLeases((data || []) as Lease[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const reportMaintenance = useCallback(async (request: Partial<MaintenanceTicket>) => {
    if (!user?.id) return null;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('maintenance_tickets')
        .insert({ ...request, tenant_id: user.id })
        .select()
        .single();
      if (err) throw err;
      const newRequest = data as MaintenanceTicket;
      setMaintenance((prev) => [newRequest, ...prev]);
      return newRequest;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchMaintenance = useCallback(async (propertyId?: string) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let query = supabase.from('maintenance_tickets').select('*, property:properties(title)');
      if (propertyId) query = query.eq('property_id', propertyId);
      else query = query.eq('tenant_id', user.id);
      const { data, error: err } = await query.order('created_at', { ascending: false });
      if (err) throw err;
      setMaintenance((data || []) as MaintenanceTicket[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const toggleSaved = useCallback(async (propertyId: string) => {
    if (!user?.id) return;
    const isSaved = savedIds.includes(propertyId);
    setSavedIds((prev) =>
      isSaved ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
    try {
      if (isSaved) {
        await supabase.from('saved_properties').delete().eq('user_id', user.id).eq('property_id', propertyId);
      } else {
        await supabase.from('saved_properties').insert({ user_id: user.id, property_id: propertyId });
      }
    } catch (e: any) {
      console.error('[useStay] toggleSaved:', e);
    }
  }, [user?.id, savedIds]);

  const fetchSaved = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('saved_properties')
        .select('property_id')
        .eq('user_id', user.id);
      if (error) throw error;
      setSavedIds((data || []).map((d: any) => d.property_id));
    } catch (e: any) {
      console.error('[useStay] fetchSaved:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  return {
    listings,
    myListings,
    bookings,
    myBookings,
    leases,
    maintenance,
    savedIds,
    loading,
    error,
    fetchListings,
    fetchMyListings,
    fetchListing,
    createListing,
    updateListing,
    deleteListing,
    createBooking,
    fetchMyBookings,
    fetchBookingsForProperty,
    updateBookingStatus,
    createLease,
    fetchLeases,
    reportMaintenance,
    fetchMaintenance,
    toggleSaved,
    fetchSaved,
    isSaved: (id: string) => savedIds.includes(id),
  };
}

export default useStay;
