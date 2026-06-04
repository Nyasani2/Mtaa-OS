// lib/marketplace/state/marketplace.store.ts
// Zustand store for marketplace cart, listings, and checkout state

import { create } from 'zustand';
import { cartService, CartItem, CartSummary } from '@/lib/marketplace/services/cart.service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface MarketplaceState {
  // Cart
  cartItems: CartItem[];
  cartSummary: CartSummary | null;
  cartLoading: boolean;
  cartError: string | null;

  // Listings
  listings: any[];
  listingsLoading: boolean;
  listingsError: string | null;
  selectedCategory: string | null;
  searchQuery: string;

  // Checkout
  checkoutStep: 'cart' | 'shipping' | 'payment' | 'confirm' | 'success';
  selectedShipping: any | null;
  selectedPayment: any | null;

  // Actions
  loadCart: () => Promise<void>;
  addToCart: (listingId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setCheckoutStep: (step: MarketplaceState['checkoutStep']) => void;
  setSelectedShipping: (shipping: any) => void;
  setSelectedPayment: (payment: any) => void;
  resetCheckout: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  // Initial state
  cartItems: [],
  cartSummary: null,
  cartLoading: false,
  cartError: null,

  listings: [],
  listingsLoading: false,
  listingsError: null,
  selectedCategory: null,
  searchQuery: '',

  checkoutStep: 'cart',
  selectedShipping: null,
  selectedPayment: null,

  // ─── Cart Actions ────────────────────────────────────────────────

  loadCart: async () => {
    const user = useAuthStore.getState().user;
    if (!user?.id) return;

    set({ cartLoading: true, cartError: null });
    try {
      const items = await cartService.getCart(user.id);
      const summary = await cartService.getCartSummary(user.id);
      set({ cartItems: items, cartSummary: summary, cartLoading: false });
    } catch (err: any) {
      set({ cartError: err.message || 'Failed to load cart', cartLoading: false });
    }
  },

  addToCart: async (listingId: string, quantity: number = 1) => {
    const user = useAuthStore.getState().user;
    if (!user?.id) return false;

    set({ cartLoading: true });
    const result = await cartService.addToCart(user.id, listingId, quantity);
    if (result.success) {
      await get().loadCart();
    } else {
      set({ cartError: result.error || 'Failed to add to cart', cartLoading: false });
    }
    return result.success;
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    set({ cartLoading: true });
    const result = await cartService.updateQuantity(cartItemId, quantity);
    if (result.success) {
      await get().loadCart();
    } else {
      set({ cartError: result.error || 'Failed to update quantity', cartLoading: false });
    }
    return result.success;
  },

  removeFromCart: async (cartItemId: string) => {
    set({ cartLoading: true });
    const result = await cartService.removeFromCart(cartItemId);
    if (result.success) {
      await get().loadCart();
    } else {
      set({ cartError: result.error || 'Failed to remove item', cartLoading: false });
    }
    return result.success;
  },

  clearCart: async () => {
    const user = useAuthStore.getState().user;
    if (!user?.id) return false;

    set({ cartLoading: true });
    const result = await cartService.clearCart(user.id);
    if (result.success) {
      set({ cartItems: [], cartSummary: null, cartLoading: false });
    } else {
      set({ cartError: result.error || 'Failed to clear cart', cartLoading: false });
    }
    return result.success;
  },

  // ─── Filter Actions ──────────────────────────────────────────────

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string | null) => set({ selectedCategory: category }),

  // ─── Checkout Actions ────────────────────────────────────────────

  setCheckoutStep: (step) => set({ checkoutStep: step }),
  setSelectedShipping: (shipping) => set({ selectedShipping: shipping }),
  setSelectedPayment: (payment) => set({ selectedPayment: payment }),

  resetCheckout: () => set({
    checkoutStep: 'cart',
    selectedShipping: null,
    selectedPayment: null,
  }),
}));
