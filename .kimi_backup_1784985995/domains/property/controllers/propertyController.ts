// MTAA PROPERTY OS — PROPERTY CONTROLLER
// Business logic layer between services and store

import { propertyService } from "../services/propertyService";
import { bookingService } from "../services/bookingService";
import { leaseService } from "../services/leaseService";
import { maintenanceService } from "../services/maintenanceService";
import { paymentService } from "../services/paymentService";
import type { Property, PropertyBooking, Lease, MaintenanceTicket, PropertyPayment } from "../types";

export class PropertyController {
  async getDashboardStats(userId: string, role: "tenant" | "landlord" | "host") {
    switch (role) {
      case "tenant":
        return this.getTenantDashboard(userId);
      case "landlord":
        return this.getLandlordDashboard(userId);
      case "host":
        return this.getHostDashboard(userId);
      default:
        throw new Error("Invalid role");
    }
  }

  private async getTenantDashboard(tenantId: string) {
    const [leases, tickets, payments] = await Promise.all([
      leaseService.getTenantLeases(tenantId),
      maintenanceService.getTenantTickets(tenantId),
      paymentService.getUserPayments(tenantId),
    ]);

    const activeLease = leases.find((l) => l.status === "active");
    const upcomingRent = payments.filter((p) => p.payment_type === "rent" && p.status === "pending");
    const totalPaid = payments
      .filter((p) => p.payment_type === "rent" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      activeLease,
      upcomingRent: upcomingRent[0] || null,
      totalPaid,
      openTickets: tickets.filter((t) => !["closed", "paid"].includes(t.status)).length,
      leaseCount: leases.length,
    };
  }

  private async getLandlordDashboard(landlordId: string) {
    const [properties, leases, tickets, payments] = await Promise.all([
      propertyService.getProperties().then((p) => p.filter((prop) => prop.owner_id === landlordId)),
      leaseService.getLandlordLeases(landlordId),
      maintenanceService.getLandlordTickets(landlordId),
      paymentService.getUserPayments(landlordId),
    ]);

    const activeProperties = properties.filter((p) => p.status === "active");
    const activeLeases = leases.filter((l) => l.status === "active");
    const monthlyRevenue = payments
      .filter((p) => p.payment_type === "rent" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalProperties: properties.length,
      activeProperties: activeProperties.length,
      totalTenants: activeLeases.length,
      monthlyRevenue,
      openTickets: tickets.filter((t) => !["closed", "paid"].includes(t.status)).length,
      vacancies: activeProperties.length - activeLeases.length,
    };
  }

  private async getHostDashboard(hostId: string) {
    const [bookings, properties] = await Promise.all([
      bookingService.getHostBookings(hostId),
      propertyService.getProperties().then((p) => p.filter((prop) => prop.owner_id === hostId)),
    ]);

    const confirmedBookings = bookings.filter((b) => b.booking_status === "confirmed");
    const completedBookings = bookings.filter((b) => b.booking_status === "checked_out");
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);

    return {
      totalListings: properties.length,
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      completedBookings: completedBookings.length,
      totalRevenue,
      occupancyRate: properties.length > 0 ? (confirmedBookings.length / properties.length) * 100 : 0,
    };
  }

  async processBookingPayment(bookingId: string, walletTransactionId: string): Promise<void> {
    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) throw new Error("Booking not found");

    await Promise.all([
      bookingService.confirmBooking(bookingId),
      paymentService.createPayment({
        wallet_transaction_id: walletTransactionId,
        payment_type: "booking",
        property_id: booking.property_id,
        booking_id: bookingId,
        payer_id: booking.guest_id,
        payee_id: booking.host_id,
        amount: booking.total_amount,
        currency: booking.currency,
        status: "completed",
      }),
    ]);
  }

  async processRentPayment(leaseId: string, walletTransactionId: string, amount: number): Promise<void> {
    const lease = await leaseService.getLeaseById(leaseId);
    if (!lease) throw new Error("Lease not found");

    await paymentService.createPayment({
      wallet_transaction_id: walletTransactionId,
      payment_type: "rent",
      property_id: lease.property_id,
      lease_id: leaseId,
      payer_id: lease.tenant_id,
      payee_id: lease.landlord_id,
      amount,
      currency: lease.currency,
      status: "completed",
    });
  }

  async processMaintenancePayment(ticketId: string, walletTransactionId: string): Promise<void> {
    const ticket = await maintenanceService.getTicketById(ticketId);
    if (!ticket) throw new Error("Ticket not found");

    await Promise.all([
      maintenanceService.approvePayment(ticketId, walletTransactionId),
      paymentService.createPayment({
        wallet_transaction_id: walletTransactionId,
        payment_type: "maintenance",
        property_id: ticket.property_id,
        maintenance_ticket_id: ticketId,
        payer_id: ticket.landlord_id,
        payee_id: ticket.contractor_id || ticket.landlord_id,
        amount: ticket.actual_cost || ticket.estimated_cost || 0,
        status: "completed",
      }),
    ]);
  }
}

export const propertyController = new PropertyController();
