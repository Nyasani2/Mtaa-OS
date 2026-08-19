// lib/marketplace/services/cart.service.ts
// Cart service — add, remove, update quantities, checkout flow

import { supabase } from '@/lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────

export interface ShippingAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  listing_id: string;
  quantity: number;
  unit_price: number;
  currency: string;
  listing_title: string;
  listing_image_url: string | null;
  seller_id: string;
  seller_name: string;
  created_at: string;
  updated_at: string;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  currency: string;
}

// ─── Service ───────────────────────────────────────────────────────

class CartService {
  private static instance: CartService;

  static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  // ─── Get Cart ────────────────────────────────────────────────────

  async getCart(userId?: string): Promise<any[]> {
    let uid = userId;
    if (!uid) uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return [];
    const { data: myCarts } = await supabase.from('carts').select('id').eq('user_id', uid);
    const ids = (myCarts || []).map((c: any) => c.id);
    if (!ids.length) return [];
    const { data: rows, error } = await supabase.from('cart_items').select('*').in('cart_id', ids);
    if (error) { console.error('[CartService] getCart error:', error); return []; }
    const pids = Array.from(new Set((rows || []).map((r: any) => r.product_id)));
    const prodMap: any = {};
    if (pids.length) {
      const { data: prods } = await supabase.from('products').select('id, name, images, selling_price, shop_id, shops(owner_id)').in('id', pids);
      (prods || []).forEach((pr: any) => { prodMap[pr.id] = pr; });
    }
    return (rows || []).map((i: any) => {
      const pr = prodMap[i.product_id] || {};
      return { ...i, user_id: uid, listing_id: i.product_id, quantity: i.qty,
        unit_price: i.unit_price ?? pr.selling_price ?? 0, currency: 'KES',
        product_name: pr.name || 'Item', listing_title: pr.name || 'Item',
        product_image: pr.images?.[0] || null, listing_image_url: pr.images?.[0] || null,
        seller_id: pr.shops?.owner_id || '', seller_name: '', shop_id: pr.shop_id };
    });
  }

  async getCartSummary(userId: string): Promise<CartSummary> {
    const items = await this.getCart(userId);
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    return {
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      currency: items[0]?.currency || 'USD',
    };
  }

  // ─── Shipping Addresses ──────────────────────────────────────────

  async getShippingAddresses(userId: string): Promise<ShippingAddress[]> {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('[CartService] getShippingAddresses error:', error);
      return [];
    }
    return (data || []) as ShippingAddress[];
  }

  async addShippingAddress(userId: string, address: Omit<ShippingAddress, 'id' | 'user_id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('shipping_addresses')
      .insert({ ...address, user_id: userId });

    if (error) {
      console.error('[CartService] addShippingAddress error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // ─── Add to Cart ─────────────────────────────────────────────────

  async addToCart(userId: string, listingId: string, quantity: number = 1): Promise<{ success: boolean; error?: string }> {
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('price, currency, seller_id')
      .eq('id', listingId)
      .maybeSingle();

    if (listingError || !listing) {
      return { success: false, error: 'Listing not found' };
    }

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) {
        console.error('[CartService] addToCart update error:', error);
        return { success: false, error: error.message };
      }
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          listing_id: listingId,
          quantity,
          unit_price: listing.price,
          currency: listing.currency || 'USD',
        });

      if (error) {
        console.error('[CartService] addToCart insert error:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  }

  // ─── Update Quantity ─────────────────────────────────────────────

  async updateQuantity(cartItemId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
    if (quantity < 1) {
      return this.removeFromCart(cartItemId);
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', cartItemId);

    if (error) {
      console.error('[CartService] updateQuantity error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // ─── Remove from Cart ────────────────────────────────────────────

  async removeFromCart(cartItemId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) {
      console.error('[CartService] removeFromCart error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // ─── Clear Cart ──────────────────────────────────────────────────

  async clearCart(userId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[CartService] clearCart error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // ─── Checkout Preparation ────────────────────────────────────────

  calculateTotals(items: any[]) {
    const list = items || [];
    const subtotal = list.reduce((sum: number, i: any) =>
      sum + Number(i.unit_price ?? i.selling_price ?? i.price ?? 0) * Number(i.quantity || 1), 0);
    const platformFee = Math.round(subtotal * 0.03);
    const shippingTotal = 0;
    return { subtotal, platformFee, platform_fee: platformFee, shipping: shippingTotal, shippingTotal,
      deliveryFee: shippingTotal, delivery_fee: shippingTotal, tax: 0, discount: 0, savings: 0,
      total: subtotal + platformFee + shippingTotal, grandTotal: subtotal + platformFee + shippingTotal,
      currency: list[0]?.currency || 'KES' };
  }

  async checkout(payload: any): Promise<any> {
    try {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) return { success: false, error: 'Not signed in' };
      const items: any[] = payload?.items || [];
      if (!items.length) return { success: false, error: 'Cart is empty' };
      const totals = this.calculateTotals(items);

      const pids = Array.from(new Set(items.map((i: any) => i.product_id).filter(Boolean)));
      const { data: prods } = await supabase.from('products').select('id, name, shop_id, stock_quantity, selling_price, shops(owner_id)').in('id', pids);
      const prodMap: any = {}; (prods || []).forEach((pr: any) => { prodMap[pr.id] = pr; });

      for (const i of items) {
        const pr = prodMap[i.product_id];
        if (!pr) return { success: false, error: 'Product not found' };
        if ((pr.stock_quantity || 0) < (i.quantity || 1)) return { success: false, error: 'Insufficient stock for ' + pr.name };
      }

      if ((payload?.payment_method || 'wallet') === 'wallet') {
        const bySeller: any = {};
        for (const i of items) {
          const sid = prodMap[i.product_id]?.shops?.owner_id;
          if (!sid || sid === uid) continue;
          bySeller[sid] = (bySeller[sid] || 0) + Number(i.unit_price || 0) * Number(i.quantity || 1);
        }
        for (const sid of Object.keys(bySeller)) {
          const { error } = await supabase.rpc('execute_p2p_transfer', {
            p_sender_id: uid, p_receiver_id: sid, p_amount: bySeller[sid],
            p_currency: 'KES', p_description: 'MTAA Marketplace purchase',
          });
          if (error) {
            const msg = (error.message || '').toLowerCase();
            return (msg.includes('balance') || msg.includes('insufficient'))
              ? { success: false, code: 'INSUFFICIENT_FUNDS', error: error.message }
              : { success: false, error: error.message };
          }
        }
      }

      for (const i of items) {
        const pr = prodMap[i.product_id];
        await supabase.from('products').update({ stock_quantity: Math.max((pr.stock_quantity || 0) - (i.quantity || 1), 0) }).eq('id', i.product_id);
      }

      let orderId: string | null = null;
      const sellers = Array.from(new Set(items.map((i: any) => prodMap[i.product_id]?.shops?.owner_id).filter(Boolean)));
      for (const sid of (sellers.length ? sellers : [null])) {
        const mine = items.filter((i: any) => (sid ? prodMap[i.product_id]?.shops?.owner_id === sid : true));
        const sub = mine.reduce((s2: number, i: any) => s2 + Number(i.unit_price || 0) * Number(i.quantity || 1), 0);
        const fee = Math.round(sub * 0.025);
        const { data: ord, error: oe } = await supabase.from('marketplace_orders').insert({
          buyer_id: uid, seller_id: sid,
          items: mine.map((i: any) => ({ product_id: i.product_id, name: prodMap[i.product_id]?.name, qty: i.quantity, unit_price: i.unit_price })),
          subtotal: sub, platform_fee: fee, shipping: 0, total: sub + fee, currency: 'KES',
          status: 'paid', payment_method: payload?.payment_method || 'wallet',
          shipping_address: payload?.shipping_address || null, notes: payload?.notes || null,
        }).select().single();
        if (!oe && ord) orderId = ord.id;
      }

      const { data: myCarts } = await supabase.from('carts').select('id').eq('user_id', uid);
      const cids = (myCarts || []).map((cc: any) => cc.id);
      if (cids.length) await supabase.from('cart_items').delete().in('cart_id', cids);

      return { success: true, order_id: orderId, total: totals.total };
    } catch (e: any) {
      console.error('[CartService] checkout error:', e);
      return { success: false, error: e?.message || String(e) };
    }
  }

  async prepareCheckout(userId: string): Promise<{
    success: boolean;
    summary?: CartSummary;
    error?: string;
  }> {
    const summary = await this.getCartSummary(userId);

    if (summary.items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    const listingIds = summary.items.map((i: any) => i.listing_id);
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, status')
      .in('id', listingIds);

    if (error) {
      return { success: false, error: 'Failed to verify listings' };
    }

    const inactive = listings?.filter((l: any) => l.status !== 'active') || [];
    if (inactive.length > 0) {
      return { success: false, error: `${inactive.length} item(s) are no longer available` };
    }

    return { success: true, summary };
  }
}

export const cartService = CartService.getInstance();
