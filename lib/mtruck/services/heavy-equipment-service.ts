import { supabase } from '@/lib/supabase/client';
import type { HeavyEquipment, EquipmentBooking, HeavyEquipmentType } from '@/lib/mtruck/types';

const TABLE_EQUIPMENT = 'mtruck_heavy_equipment';
const TABLE_BOOKINGS = 'mtruck_equipment_bookings';

export const heavyEquipmentService = {
  async getAvailableEquipment(filters?: {
    type?: HeavyEquipmentType;
    nearLat?: number;
    nearLng?: number;
    radiusKm?: number;
    minCapacity?: number;
    maxRatePerDay?: number;
  }): Promise<HeavyEquipment[]> {
    let query = supabase
      .from(TABLE_EQUIPMENT)
      .select('*')
      .eq('status', 'available');

    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.minCapacity) query = query.gte('capacity', filters.minCapacity);
    if (filters?.maxRatePerDay) query = query.lte('rate_per_day', filters.maxRatePerDay);

    const { data, error } = await query.order('rate_per_day', { ascending: true });

    if (error) throw new Error(`Fetch equipment failed: ${error.message}`);
    return (data ?? []).map(mapEquipment);
  },

  async getEquipmentById(id: string): Promise<HeavyEquipment> {
    const { data, error } = await supabase
      .from(TABLE_EQUIPMENT)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Fetch equipment failed: ${error.message}`);
    return mapEquipment(data);
  },

  async getMyBookings(requesterId: string): Promise<EquipmentBooking[]> {
    const { data, error } = await supabase
      .from(TABLE_BOOKINGS)
      .select(`*, ${TABLE_EQUIPMENT}(*)`)
      .eq('requester_id', requesterId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch bookings failed: ${error.message}`);
    return (data ?? []).map(mapBooking);
  },

  async bookEquipment(data: {
    equipmentId: string;
    requesterId: string;
    jobId?: string;
    startDate: string;
    endDate: string;
    hoursPerDay: number;
    operatorIncluded: boolean;
    deliveryLocation: { lat: number; lng: number; address: string };
  }): Promise<EquipmentBooking> {
    // Get equipment rate
    const { data: eq, error: eqErr } = await supabase
      .from(TABLE_EQUIPMENT)
      .select('rate_per_day, rate_per_hour, operator_required')
      .eq('id', data.equipmentId)
      .single();

    if (eqErr) throw new Error(`Fetch equipment rate failed: ${eqErr.message}`);
    if (!eq) throw new Error('Equipment not found');

    const days = Math.ceil(
      (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const rateAgreed = (eq.rate_per_day * days) + (eq.rate_per_hour * data.hoursPerDay * days);

    const { data: booking, error } = await supabase
      .from(TABLE_BOOKINGS)
      .insert({
        equipment_id: data.equipmentId,
        requester_id: data.requesterId,
        job_id: data.jobId ?? null,
        start_date: data.startDate,
        end_date: data.endDate,
        hours_per_day: data.hoursPerDay,
        rate_agreed: rateAgreed,
        operator_included: data.operatorIncluded && eq.operator_required,
        status: 'pending',
        delivery_location: data.deliveryLocation,
      })
      .select()
      .single();

    if (error) throw new Error(`Book equipment failed: ${error.message}`);
    return mapBooking(booking);
  },

  async cancelBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_BOOKINGS)
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .in('status', ['pending', 'confirmed']);

    if (error) throw new Error(`Cancel booking failed: ${error.message}`);
  },

  async getEquipmentSummary(): Promise<Record<HeavyEquipmentType, number>> {
    const { data, error } = await supabase
      .from(TABLE_EQUIPMENT)
      .select('type')
      .eq('status', 'available');

    if (error) throw new Error(`Summary failed: ${error.message}`);

    // Manual count since .group() is not supported
    const summary: Record<string, number> = {};
    for (const row of data ?? []) {
      summary[row.type] = (summary[row.type] || 0) + 1;
    }
    return summary as Record<HeavyEquipmentType, number>;
  },
};

function mapEquipment(row: any): HeavyEquipment {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    capacity: row.capacity,
    dimensions: row.dimensions,
    operatorRequired: row.operator_required,
    ratePerDay: row.rate_per_day,
    ratePerHour: row.rate_per_hour,
    location: row.location,
    status: row.status,
    ownerId: row.owner_id,
    images: row.images ?? [],
    certifications: row.certifications ?? [],
    insuranceExpiry: row.insurance_expiry,
    createdAt: row.created_at,
  };
}

function mapBooking(row: any): EquipmentBooking {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    equipmentType: row.mtruck_heavy_equipment?.type ?? row.equipment_type,
    requesterId: row.requester_id,
    jobId: row.job_id,
    startDate: row.start_date,
    endDate: row.end_date,
    hoursPerDay: row.hours_per_day,
    rateAgreed: row.rate_agreed,
    operatorIncluded: row.operator_included,
    status: row.status,
    deliveryLocation: row.delivery_location,
    createdAt: row.created_at,
  };
}
