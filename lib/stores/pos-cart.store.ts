import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  unit_price: number;
  cost_price: number; // For real-time COGS calculation
  discount: number;
}

interface PosCartState {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity' | 'discount'>) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getEstimatedProfit: () => number; // (unit_price - cost_price) * quantity
}

export const usePosCartStore = create<PosCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => set((state) => {
        const existing = state.items.find((i) => i.product_id === product.product_id);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.product_id === product.product_id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          };
        }
        return { items: [...state.items, { ...product, quantity: 1, discount: 0 }] };
      }),
      removeItem: (product_id) => set((state) => ({
        items: state.items.filter((i) => i.product_id !== product_id),
      })),
      updateQuantity: (product_id, quantity) => set((state) => ({
        items: state.items.map((i) =>
          i.product_id === product_id ? { ...i, quantity: Math.max(1, quantity) } : i
        ),
      })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () => get().items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
      getEstimatedProfit: () => get().items.reduce((sum, item) => sum + (item.unit_price - item.cost_price) * item.quantity, 0),
    }),
    { name: 'mtaa-pos-cart-storage' }
  )
);
