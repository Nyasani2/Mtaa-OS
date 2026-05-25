// domains/shop/state/shopStore.ts
import { create } from 'zustand';
import { shopService, ShopProduct, Shop } from '../services/shopService';

interface ShopStore {
  products: ShopProduct[];
  shops: Shop[];
  cart: { product: ShopProduct; quantity: number }[];
  loading: boolean;
  error: string | null;
  loadProducts: (shopId?: string) => Promise<void>;
  loadShops: () => Promise<void>;
  addToCart: (product: ShopProduct, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  searchProducts: (options?: { category?: string; search?: string }) => ShopProduct[];
}

export const useShopStore = create<ShopStore>((set, get) => ({
  products: [],
  shops: [],
  cart: [],
  loading: false,
  error: null,

  loadProducts: async (shopId?: string) => {
    set({ loading: true, error: null });
    try {
      const products = await shopService.getProducts(shopId);
      set({ products, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load', loading: false });
    }
  },

  loadShops: async () => {
    set({ loading: true, error: null });
    try {
      const shops = await shopService.getShops();
      set({ shops, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load', loading: false });
    }
  },

  addToCart: (product, quantity) => {
    set((state) => {
      const existing = state.cart.find((item) => item.product.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { product, quantity }] };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    }));
  },

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  searchProducts: (options) => {
    let filtered = get().products;
    if (options?.category) {
      filtered = filtered.filter((p: ShopProduct) => p.category === options.category);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter((p: ShopProduct) => p.name?.toLowerCase().includes(q));
    }
    return filtered;
  },
}));

export default useShopStore;
