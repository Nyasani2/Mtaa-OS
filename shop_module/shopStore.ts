// lib/shop/state/shopStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Shop, ShopProduct, ShopOrder, CartItem, DashboardStats, ShopCategory } from "../types";
import { ShopService } from "../services/shopService";

interface ShopState {
  // Current shop context
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop | null) => void;

  // Products
  products: ShopProduct[];
  productsLoading: boolean;
  loadProducts: (shopId: string, options?: any) => Promise<void>;
  addProduct: (product: ShopProduct) => void;
  updateProductInStore: (id: string, updates: Partial<ShopProduct>) => void;

  // Categories
  categories: ShopCategory[];
  loadCategories: (shopId: string) => Promise<void>;

  // Orders
  orders: ShopOrder[];
  ordersLoading: boolean;
  loadOrders: (shopId: string, status?: string) => Promise<void>;
  addOrder: (order: ShopOrder) => void;
  updateOrderInStore: (id: string, updates: Partial<ShopOrder>) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartItemCount: () => number;

  // POS
  posSession: any | null;
  setPosSession: (session: any) => void;
  posCart: CartItem[];
  addToPosCart: (item: CartItem) => void;
  removeFromPosCart: (productId: string) => void;
  clearPosCart: () => void;
  posCartTotal: () => number;

  // Dashboard
  dashboardStats: DashboardStats | null;
  dashboardLoading: boolean;
  loadDashboard: (shopId: string) => Promise<void>;

  // Search
  searchResults: ShopProduct[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchProducts: (shopId: string, query: string) => Promise<void>;

  // UI State
  activeTab: "dashboard" | "pos" | "products" | "orders" | "inventory" | "accounting" | "affiliates" | "settings";
  setActiveTab: (tab: ShopState["activeTab"]) => void;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      currentShop: null,
      setCurrentShop: (shop) => set({ currentShop: shop }),

      products: [],
      productsLoading: false,
      loadProducts: async (shopId, options) => {
        set({ productsLoading: true });
        try {
          const products = await ShopService.getProducts(shopId, options);
          set({ products, productsLoading: false });
        } catch (error) {
          set({ productsLoading: false, error: (error as Error).message });
        }
      },
      addProduct: (product) => set((state) => ({ products: [product, ...state.products] })),
      updateProductInStore: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      categories: [],
      loadCategories: async (shopId) => {
        try {
          const categories = await ShopService.getCategories(shopId);
          set({ categories });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      orders: [],
      ordersLoading: false,
      loadOrders: async (shopId, status) => {
        set({ ordersLoading: true });
        try {
          const orders = await ShopService.getOrders(shopId, status);
          set({ orders, ordersLoading: false });
        } catch (error) {
          set({ ordersLoading: false, error: (error as Error).message });
        }
      },
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateOrderInStore: (id, updates) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        })),

      cart: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((i) => i.product.id === item.product.id);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.product.id === item.product.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      removeFromCart: (productId) =>
        set((state) => ({ cart: state.cart.filter((i) => i.product.id !== productId) })),
      updateCartQuantity: (productId, quantity) =>
        set((state) => ({
          cart: quantity <= 0
            ? state.cart.filter((i) => i.product.id !== productId)
            : state.cart.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ cart: [] }),
      cartTotal: () => {
        return get().cart.reduce((sum, item) => {
          const price = item.product.sale_price || item.product.base_price;
          return sum + price * item.quantity;
        }, 0);
      },
      cartItemCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),

      posSession: null,
      setPosSession: (session) => set({ posSession: session }),
      posCart: [],
      addToPosCart: (item) =>
        set((state) => {
          const existing = state.posCart.find((i) => i.product.id === item.product.id);
          if (existing) {
            return {
              posCart: state.posCart.map((i) =>
                i.product.id === item.product.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { posCart: [...state.posCart, item] };
        }),
      removeFromPosCart: (productId) =>
        set((state) => ({ posCart: state.posCart.filter((i) => i.product.id !== productId) })),
      clearPosCart: () => set({ posCart: [] }),
      posCartTotal: () => {
        return get().posCart.reduce((sum, item) => {
          const price = item.product.sale_price || item.product.base_price;
          return sum + price * item.quantity;
        }, 0);
      },

      dashboardStats: null,
      dashboardLoading: false,
      loadDashboard: async (shopId) => {
        set({ dashboardLoading: true });
        try {
          const stats = await ShopService.getDashboardStats(shopId);
          set({ dashboardStats: stats, dashboardLoading: false });
        } catch (error) {
          set({ dashboardLoading: false, error: (error as Error).message });
        }
      },

      searchResults: [],
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),
      searchProducts: async (shopId, query) => {
        try {
          const products = await ShopService.getProducts(shopId, { search: query, activeOnly: true });
          set({ searchResults: products, searchQuery: query });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      activeTab: "dashboard",
      setActiveTab: (tab) => set({ activeTab: tab }),
      isLoading: false,
      error: null,
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "shop-store",
      partialize: (state) => ({ cart: state.cart, currentShop: state.currentShop, posSession: state.posSession }),
    }
  )
);
