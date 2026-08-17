// domains/shop/services/posService.ts
// MTAA Shop POS — Staff PIN auth + Session management
// Uses existing shop_staff.pin_code — NO duplicate PIN system

import { supabase } from '@/lib/supabase/client';

export interface POSSession {
  id: string;
  shop_id: string;
  staff_id: string;
  opened_at: string;
  closed_at?: string;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  cash_difference?: number;
  total_sales: number;
  total_transactions: number;
  total_refunds: number;
  status: 'open' | 'closed' | 'verified';
  notes?: string;
}

export interface POSStaff {
  id: string;
  shop_id: string;
  user_id?: string;
  name: string;
  role: string;
  pin_code?: string;
  is_active: boolean;
}

export class POSService {
  /**
   * Verify staff PIN against shop_staff table.
   * Returns staff record if PIN matches, null otherwise.
   */
  async verifyStaffPin(shopId: string, pin: string): Promise<POSStaff | null> {
    const { data, error } = await supabase
      .from('shop_staff')
      .select('id, shop_id, user_id, name, role, pin_code, is_active')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .eq('pin_code', pin)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Start a new POS session after successful PIN verification.
   */
  async startSession(
    shopId: string,
    staffId: string,
    openingCash: number = 0
  ): Promise<POSSession> {
    const { data, error } = await supabase
      .from('pos_sessions')
      .insert({
        shop_id: shopId,
        staff_id: staffId,
        opening_cash: openingCash,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Close an active POS session.
   */
  async closeSession(
    sessionId: string,
    closingCash: number,
    notes?: string
  ): Promise<POSSession> {
    const { data: session } = await supabase
      .from('pos_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) throw new Error('Session not found');

    const expectedCash = (session.opening_cash || 0) + (session.total_sales || 0) - (session.total_refunds || 0);
    const cashDifference = closingCash - expectedCash;

    const { data, error } = await supabase
      .from('pos_sessions')
      .update({
        closed_at: new Date().toISOString(),
        closing_cash: closingCash,
        expected_cash: expectedCash,
        cash_difference: cashDifference,
        status: 'closed',
        notes: notes || session.notes,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get the currently open POS session for a shop.
   */
  async getActiveSession(shopId: string): Promise<POSSession | null> {
    const { data, error } = await supabase
      .from('pos_sessions')
      .select('*')
      .eq('shop_id', shopId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  /**
   * Update session totals after a sale.
   */
  async recordSale(sessionId: string, amount: number): Promise<void> {
    const { data: session } = await supabase
      .from('pos_sessions')
      .select('total_sales, total_transactions')
      .eq('id', sessionId)
      .single();

    if (!session) return;

    await supabase
      .from('pos_sessions')
      .update({
        total_sales: (session.total_sales || 0) + amount,
        total_transactions: (session.total_transactions || 0) + 1,
      })
      .eq('id', sessionId);
  }

  /**
   * Get all staff for a shop (for PIN login selection).
   */
  async getShopStaff(shopId: string): Promise<POSStaff[]> {
    const { data, error } = await supabase
      .from('shop_staff')
      .select('id, shop_id, user_id, name, role, is_active')
      .eq('shop_id', shopId)
      .eq('is_active', true);

    if (error) throw error;
    return data ?? [];
  }
}

export const posService = new POSService();
export default posService;
