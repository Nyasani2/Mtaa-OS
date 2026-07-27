// MTAA STAY OS — BOOKING SERVICE
// Integrates with Wallet for payments

import { supabase } from "@/lib/supabase";
import type { StayBooking } from "../types";

export class BookingService {
  async createBooking(booking: Partial<StayBooking>): Promise<StayBooking> {
    const { data, error } = await supabase
      .from("property_bookings")
      .insert(booking)
      .select()
      .single();
    if (error) throw error;

    await this.notifyHost(booking.host_id!, "booking_created", "New booking request", `You have a new booking request for ${booking.check_in_date}`);

    return data;
  }

  async getBookingById(id: string): Promise<StayBooking | null> {
    const { data, error } = await supabase
      .from("property_bookings")
      .select("*, property:properties(*), guest:profiles!guest_id(*), host:profiles!host_id(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async getGuestBookings(guestId: string): Promise<StayBooking[]> {
    const { data, error } = await supabase
      .from("property_bookings")
      .select("*, property:properties(title, cover_image)")
      .eq("guest_id", guestId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getHostBookings(hostId: string): Promise<StayBooking[]> {
    const { data, error } = await supabase
      .from("property_bookings")
      .select("*, property:properties(title), guest:profiles!guest_id(full_name, avatar_url)")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async confirmBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from("property_bookings")
      .update({ booking_status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (error) throw error;
  }

  async cancelBooking(bookingId: string, reason: string, byHost: boolean): Promise<void> {
    const status = byHost ? "cancelled_by_host" : "cancelled_by_guest";
    const { error } = await supabase
      .from("property_bookings")
      .update({
        booking_status: status,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq("id", bookingId);
    if (error) throw error;
  }

  async checkIn(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from("property_bookings")
      .update({ booking_status: "checked_in", checked_in_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (error) throw error;
  }

  async checkOut(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from("property_bookings")
      .update({ booking_status: "checked_out", checked_out_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (error) throw error;
  }

  private async notifyHost(hostId: string, type: string, title: string, body: string): Promise<void> {
    await supabase.from("property_notifications").insert({
      user_id: hostId,
      notification_type: type,
      title,
      body,
    });
  }
}

export const bookingService = new BookingService();
