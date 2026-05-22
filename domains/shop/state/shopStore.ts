import { create } from 'zustand';
import { Shop, ShopProduct, ShopOrder, CartItem } from '../types';
import { ShopService } from '../services/shopService';

interface ShopState {
  currentShop: Shop | null;
  products: ShopProduct[];
  orders: ShopOrder[];
  cart: CartItem[];
  productsLoading: boolean;
  ordersLoading: boolean;
  setCurrentShop: (shop: Shop | null) => void;
  loadProducts: (shopId: string, options?: any) => Promise<void>;
  loadOrders: (shopId: string, status?: string) => Promise<void>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  currentShop: null,
  products: [],
  orders: [],
  cart: [],
  productsLoading: false,
  ordersLoading: false,

  setCurrentShop: (shop) => set({ currentShop: shop }),

  loadProducts: async (shopId, options) => {
    set({ productsLoading: true });
    try {
      const data = await ShopService.getProducts(shopId);
      let filtered = data;
      if (options?.category) filtered = filtered.filter((p) => p.category === options.category);
      if (options?.search) filtered = filtered.filter((p) => p.name?.toLowerCase().includes(options.search.toLowerCase()));
      set({ products: filtered });
    } catch (e) {
      console.error('Failed to load products:', e);
    } finally {
      set({ productsLoading: false });
    }
  },

  loadOrders: async (shopId, status) => {
    set({ ordersLoading: true });
    try {
      const data = await ShopService.getOrders(shopId, status);
      set({ orders: data });
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      set({ ordersLoading: false });
    }
  },

  addToCart: (item) => {
    const cart = get().cart;
    const existing = cart.find((c) => c.product_id === item.product_id);
    if (existing) {
      set({
        cart: cart.map((c) =>
          c.product_id === item.product_id ? { ...c, quantity: c.quantity + item.quantity } : c
        )
      });
    } else {
      set({ cart: [...cart, item] });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((c) => c.product_id !== productId) });
  },

  clearCart: () => set({ cart: [] }),
}));
