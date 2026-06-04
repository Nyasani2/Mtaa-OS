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

  async getCart(userId: string): Promise<CartItem[]> {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        listing_id,
        quantity,
        unit_price,
        currency,
        created_at,
        updated_at,
        listings:listing_id (
          title,
          image_url,
          seller_id,
          profiles:seller_id (display_name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CartService] getCart error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      listing_id: row.listing_id,
      quantity: row.quantity,
      unit_price: row.unit_price,
      currency: row.currency || 'USD',
      listing_title: row.listings?.title || 'Unknown Item',
      listing_image_url: row.listings?.image_url || null,
      seller_id: row.listings?.seller_id || '',
      seller_name: row.listings?.profiles?.display_name || 'Unknown Seller',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
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
      .single();

    if (listingError || !listing) {
      return { success: false, error: 'Listing not found' };
    }

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();

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

  async prepareCheckout(userId: string): Promise<{
    success: boolean;
    summary?: CartSummary;
    error?: string;
  }> {
    const summary = await this.getCartSummary(userId);

    if (summary.items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    const listingIds = summary.items.map(i => i.listing_id);
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, status')
      .in('id', listingIds);

    if (error) {
      return { success: false, error: 'Failed to verify listings' };
    }

    const inactive = listings?.filter(l => l.status !== 'active') || [];
    if (inactive.length > 0) {
      return { success: false, error: `${inactive.length} item(s) are no longer available` };
    }

    return { success: true, summary };
  }
}

export const cartService = CartService.getInstance();
