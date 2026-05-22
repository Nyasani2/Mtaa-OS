import { create } from "zustand";

interface ShopStoreState {
  currentShop: string | null;
  posCart: any[];
  activeTab: string;
  setCurrentShop: (shop: string | null) => void;
  setActiveTab: (tab: string) => void;
  addToPosCart: (item: any) => void;
  removeFromPosCart: (id: string) => void;
  clearPosCart: () => void;
  posCartTotal: () => number;
}

export const useShopStore = create<ShopStoreState>((set, get) => ({
  currentShop: null,
  posCart: [],
  activeTab: "dashboard",
  setCurrentShop: (shop) => set({ currentShop: shop }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addToPosCart: (item) => set((s) => ({ posCart: [...s.posCart, item] })),
  removeFromPosCart: (id) => set((s) => ({ posCart: s.posCart.filter((i) => i.id !== id) })),
  clearPosCart: () => set({ posCart: [] }),
  posCartTotal: () => get().posCart.reduce((sum, item) => sum + (item.price || 0), 0),
}));

export default useShopStore;
