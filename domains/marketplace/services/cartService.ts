// lib/marketplace/services/cart.service.ts
// Cart/Checkout service — handles cart, checkout, escrow, order creation

import { supabase } from '@/lib/supabase/client';
import { identityEngine } from '@/lib/kernel/identity';
import { withdrawService } from '@/lib/wallet/services/withdraw.service';

export interface CartItem {
  id: string;
  product_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  currency: string;
  product_name: string;
  product_image?: string;
  seller_name?: string;
  shipping_cost?: number;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CheckoutRequest {
  items: CartItem[];
  shipping_address: ShippingAddress;
  payment_method: 'wallet' | 'card' | 'mobile_money';
  currency: string;
  notes?: string;
}

export interface OrderResult {
  success: boolean;
  order_id?: string;
  total?: number;
  fee?: number;
  status?: string;
  error?: string;
  code?: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
  total_amount: number;
  platform_fee: number;
  currency: string;
  shipping_address: ShippingAddress;
  items: CartItem[];
  created_at: string;
  updated_at: string;
  tracking_number?: string;
}

class CartService {
  private static instance: CartService;

  static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  /**
   * Add item to cart (stored in local state + sync to DB)
   */
  async addToCart(productId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Get product details
    const { data: product, error } = await supabase
      .from('marketplace_listings')
      .select('id, title, price, currency, seller_id, images')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return { success: false, error: 'Product not found' };
    }

    // Check stock
    const { data: stock } = await supabase
      .from('marketplace_inventory')
      .select('quantity')
      .eq('listing_id', productId)
      .single();

    if (stock && stock.quantity < quantity) {
      return { success: false, error: `Only ${stock.quantity} available` };
    }

    // Upsert cart item
    const { error: cartError } = await supabase
      .from('cart_items')
      .upsert({
        user_id: user.id,
        product_id: productId,
        quantity,
        unit_price: product.price,
        currency: product.currency,
        seller_id: product.seller_id,
      }, { onConflict: 'user_id,product_id' });

    if (cartError) {
      return { success: false, error: cartError.message };
    }

    return { success: true };
  }

  /**
   * Get user's cart
   */
  async getCart(): Promise<CartItem[]> {
    const user = await identityEngine.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        seller_id,
        quantity,
        unit_price,
        currency,
        marketplace_listings:product_id (title, images),
        profiles:seller_id (first_name, last_name)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Cart fetch error:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      seller_id: item.seller_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency: item.currency,
      product_name: item.marketplace_listings?.title || 'Unknown',
      product_image: item.marketplace_listings?.images?.[0],
      seller_name: `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim(),
    }));
  }

  /**
   * Update cart item quantity
   */
  async updateQuantity(cartItemId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
    if (quantity <= 0) {
      return this.removeFromCart(cartItemId);
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(cartItemId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /**
   * Calculate checkout totals
   */
  calculateTotals(items: CartItem[]): {
    subtotal: number;
    platformFee: number;
    shippingTotal: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const platformFee = Math.round(subtotal * 0.025 * 100) / 100; // 2.5% platform fee
    const shippingTotal = items.reduce((sum, item) => sum + (item.shipping_cost || 0), 0);
    const total = subtotal + platformFee + shippingTotal;

    return { subtotal, platformFee, shippingTotal, total };
  }

  /**
   * Checkout — create order, reserve funds in escrow, deduct from wallet
   */
  async checkout(request: CheckoutRequest): Promise<OrderResult> {
    const user = await identityEngine.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated', code: 'AUTH_REQUIRED' };
    }

    // Validate cart not empty
    if (!request.items || request.items.length === 0) {
      return { success: false, error: 'Cart is empty', code: 'EMPTY_CART' };
    }

    // Check KYC for purchases over threshold
    const kyc = await withdrawService.checkKycLevel();
    const totals = this.calculateTotals(request.items);

    if (totals.total > 10000 && !kyc.eligible) {
      return {
        success: false,
        error: 'KYC Level 2 required for purchases over 10,000',
        code: 'KYC_REQUIRED',
      };
    }

    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance, status')
      .eq('user_id', user.id)
      .eq('currency', request.currency)
      .single();

    if (!wallet) {
      return { success: false, error: 'Wallet not found', code: 'WALLET_MISSING' };
    }

    if (wallet.status !== 'active') {
      return { success: false, error: 'Wallet is frozen', code: 'WALLET_FROZEN' };
    }

    if (wallet.balance < totals.total) {
      return {
        success: false,
        error: 'Insufficient balance',
        code: 'INSUFFICIENT_FUNDS',
      };
    }

    // Call edge function for atomic checkout
    const { data, error } = await supabase.functions.invoke('marketplace-checkout', {
      body: {
        buyer_id: user.id,
        items: request.items,
        shipping_address: request.shipping_address,
        payment_method: request.payment_method,
        currency: request.currency,
        notes: request.notes,
        totals,
      },
    });

    if (error) {
      return { success: false, error: error.message, code: 'EDGE_FUNCTION_ERROR' };
    }

    if (data?.error) {
      return { success: false, error: data.error, code: data.code };
    }

    // Clear cart on success
    await this.clearCart();

    return {
      success: true,
      order_id: data.order_id,
      total: data.total,
      fee: data.fee,
      status: data.status,
    };
  }

  /**
   * Get user's orders
   */
  async getOrders(status?: string, limit = 20): Promise<Order[]> {
    const user = await identityEngine.getUser();
    if (!user) return [];

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Orders fetch error:', error);
      return [];
    }

    return (data || []).map((order: any) => ({
      id: order.id,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      status: order.status,
      total_amount: order.total_amount,
      platform_fee: order.platform_fee,
      currency: order.currency,
      shipping_address: order.shipping_address,
      items: order.order_items || [],
      created_at: order.created_at,
      updated_at: order.updated_at,
      tracking_number: order.tracking_number,
    }));
  }

  /**
   * Confirm delivery (release escrow to seller)
   */
  async confirmDelivery(orderId: string): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase.functions.invoke('confirm-delivery', {
      body: { order_id: orderId, buyer_id: user.id },
    });

    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };

    return { success: true };
  }

  /**
   * Raise dispute
   */
  async raiseDispute(orderId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('order_disputes')
      .insert({
        order_id: orderId,
        raised_by: user.id,
        reason,
        status: 'open',
      });

    if (error) return { success: false, error: error.message };

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'disputed' })
      .eq('id', orderId);

    return { success: true };
  }
}

export const cartService = CartService.getInstance();
