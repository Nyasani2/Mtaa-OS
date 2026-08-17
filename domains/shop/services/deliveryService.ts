// domains/shop/services/deliveryService.ts
// MTAA Shop Delivery — Aligned to actual schema
// shop_orders is a VIEW on orders table with limited columns
// All delivery-specific data lives in shop_delivery_requests

import { supabase } from '@/lib/supabase/client';

export interface DeliveryAgent {
  id: string;
  shop_id: string;
  user_id?: string;
  name: string;
  role: string;
  is_active: boolean;
}

export interface DeliveryRequest {
  id: string;
  order_id: string;
  shop_id: string;
  delivery_type: 'in_house' | 'boda' | 'mtaxi' | 'mtruck';
  external_trip_id?: string;
  external_module?: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  assigned_agent_id?: string;
  pickup_address?: string;
  dropoff_address?: string;
  estimated_distance_km?: number;
  estimated_fare?: number;
  final_fare?: number;
  customer_phone?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
}

export class DeliveryService {
  // ── In-House Agents ──────────────────────────────────────

  async getAvailableAgents(shopId: string): Promise<DeliveryAgent[]> {
    const { data, error } = await supabase
      .from('shop_staff')
      .select('id, shop_id, user_id, name, role, is_active')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .in('role', ['delivery_agent', 'owner', 'manager']);
    if (error) throw error;
    return data ?? [];
  }

  async verifyStaffPin(shopId: string, pin: string): Promise<DeliveryAgent | null> {
    const { data, error } = await supabase
      .from('shop_staff')
      .select('id, shop_id, user_id, name, role, is_active')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .eq('pin_code', pin)
      .single();
    if (error || !data) return null;
    return data;
  }

  async assignInHouseAgent(orderId: string, shopId: string, agentId: string): Promise<void> {
    // Update delivery request
    const { error } = await supabase
      .from('shop_delivery_requests')
      .upsert({
        order_id: orderId,
        shop_id: shopId,
        assigned_agent_id: agentId,
        delivery_type: 'in_house',
        status: 'assigned',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'order_id' });

    if (error) throw error;

    // Update order status through the view (only 'status' column exists)
    await supabase.from('shop_orders').update({ status: 'out_for_delivery' }).eq('id', orderId);
  }

  // ── External Dispatch (Boda/MTaxi/MTruck) ───────────────

  async dispatchExternal(
    orderId: string,
    shopId: string,
    type: 'boda' | 'mtaxi' | 'mtruck',
    pickup: { address: string },
    dropoff: { address: string },
    customerPhone?: string
  ): Promise<{ requestId: string; externalId?: string; estimatedFare: number }> {
    // Create delivery request first
    const { data: req, error: reqErr } = await supabase
      .from('shop_delivery_requests')
      .insert({
        order_id: orderId,
        shop_id: shopId,
        delivery_type: type,
        status: 'pending',
        pickup_address: pickup.address,
        dropoff_address: dropoff.address,
        customer_phone: customerPhone,
      })
      .select()
      .single();

    if (reqErr || !req) throw reqErr || new Error('Failed to create delivery request');

    // Update order status
    await supabase.from('shop_orders').update({ status: 'out_for_delivery' }).eq('id', orderId);

    return { requestId: req.id, estimatedFare: 0 };
  }

  // ── Status Updates ───────────────────────────────────────

  async updateDeliveryStatus(orderId: string, status: 'picked_up' | 'in_transit' | 'delivered' | 'failed'): Promise<void> {
    // Update delivery request
    await supabase
      .from('shop_delivery_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('order_id', orderId);

    // Update order status
    const orderStatus = status === 'delivered' ? 'delivered' : status === 'failed' ? 'cancelled' : 'out_for_delivery';
    await supabase.from('shop_orders').update({ status: orderStatus }).eq('id', orderId);
  }

  // ── Queries ──────────────────────────────────────────────

  async getDeliveryRequests(shopId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('shop_delivery_requests')
      .select(`
        *,
        shop_orders!inner(id, order_number, buyer_user_id, status, total_amount, shipping_address, notes, created_at)
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getAgentDeliveries(userId: string): Promise<any[]> {
    // Find staff records for this user
    const { data: staff } = await supabase
      .from('shop_staff')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!staff?.length) return [];

    const staffIds = staff.map((s) => s.id);

    const { data, error } = await supabase
      .from('shop_delivery_requests')
      .select(`
        *,
        shop_orders!inner(id, order_number, buyer_user_id, status, total_amount, shipping_address, notes, created_at),
        shops!inner(name, phone, address_line1)
      `)
      .in('assigned_agent_id', staffIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getCustomerDelivery(orderId: string): Promise<any> {
    const { data: order } = await supabase
      .from('shop_orders')
      .select('*, shops!inner(name, phone, address_line1)')
      .eq('id', orderId)
      .single();

    if (!order) return null;

    const { data: req } = await supabase
      .from('shop_delivery_requests')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    return { ...order, deliveryRequest: req };
  }
}

export const deliveryService = new DeliveryService();
export default deliveryService;
