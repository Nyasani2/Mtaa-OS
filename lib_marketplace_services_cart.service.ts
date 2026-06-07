import { supabase } from '@/lib/supabase';

export interface CartItem {
  id: string;
  listing_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  seller_id: string;
  seller_name: string;
  quantity: number;
  unit_price: number;
  price: number;
  currency: string;
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  label: string;
  is_default: boolean;
  created_at: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

export class CartService {
  private static instance: CartService;
  private items: CartItem[] = [];

  static getInstance(): CartService {
    if (!CartService.instance) CartService.instance = new CartService();
    return CartService.instance;
  }

  async getCart(userId?: string): Promise<CartItem[]> {
    if (!userId) return this.items;
    const { data } = await supabase.from('cart_items').select('*').eq('user_id', userId);
    return (data || []) as CartItem[];
  }

  async getCartSummary(userId: string): Promise<CartSummary> {
    const items = await this.getCart(userId);
    const subtotal = items.reduce((sum, i) => sum + (i.unit_price || i.price) * i.quantity, 0);
    const shipping = subtotal > 0 ? 500 : 0;
    const tax = subtotal * 0.16;
    return { items, subtotal, shipping, tax, total: subtotal + shipping + tax, itemCount: items.length };
  }

  async addToCart(userId: string, listingId: string, quantity: number = 1): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async updateQuantity(cartItemId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async removeFromCart(cartItemId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async clearCart(userId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  calculateTotals(): { subtotal: number; shipping: number; tax: number; total: number; itemCount: number } {
    const subtotal = this.items.reduce((sum, i) => sum + (i.unit_price || i.price) * i.quantity, 0);
    const shipping = subtotal > 0 ? 500 : 0;
    const tax = subtotal * 0.16;
    return { subtotal, shipping, tax, total: subtotal + shipping + tax, itemCount: this.items.length };
  }

  async checkout(address: ShippingAddress, paymentMethod: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
    return { success: true, orderId: 'order_' + Date.now() };
  }

  async prepareCheckout(userId: string): Promise<{ success: boolean; summary?: CartSummary; error?: string }> {
    const summary = await this.getCartSummary(userId);
    if (summary.items.length === 0) return { success: false, error: 'Cart is empty' };
    return { success: true, summary };
  }

  async getShippingAddresses(userId: string): Promise<ShippingAddress[]> {
    const { data } = await supabase.from('shipping_addresses').select('*').eq('user_id', userId);
    return (data || []) as ShippingAddress[];
  }

  async addShippingAddress(userId: string, address: Omit<ShippingAddress, 'id' | 'user_id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}

export const cartService = CartService.getInstance();
export default CartService;
