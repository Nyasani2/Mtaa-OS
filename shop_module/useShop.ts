// lib/shop/hooks/useShop.ts
import { useEffect, useState } from "react";
import { useShopStore } from "../state/shopStore";
import { ShopService } from "../services/shopService";
import { Shop } from "../types";

export function useShop(shopId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentShop = useShopStore((s) => s.currentShop);
  const setCurrentShop = useShopStore((s) => s.setCurrentShop);

  useEffect(() => {
    if (shopId && (!currentShop || currentShop.id !== shopId)) {
      setLoading(true);
      ShopService.getShopById(shopId)
        .then(setCurrentShop)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [shopId]);

  return { shop: currentShop, loading, error };
}

export function useMyShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ShopService.getMyShops()
      .then(setShops)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { shops, loading, error, refresh: () => ShopService.getMyShops().then(setShops) };
}

export function useShopProducts(shopId: string, options?: any) {
  const products = useShopStore((s) => s.products);
  const productsLoading = useShopStore((s) => s.productsLoading);
  const loadProducts = useShopStore((s) => s.loadProducts);

  useEffect(() => {
    if (shopId) loadProducts(shopId, options);
  }, [shopId, JSON.stringify(options)]);

  return { products, loading: productsLoading, refresh: () => loadProducts(shopId, options) };
}

export function useShopOrders(shopId: string, status?: string) {
  const orders = useShopStore((s) => s.orders);
  const ordersLoading = useShopStore((s) => s.ordersLoading);
  const loadOrders = useShopStore((s) => s.loadOrders);

  useEffect(() => {
    if (shopId) loadOrders(shopId, status);
  }, [shopId, status]);

  return { orders, loading: ordersLoading, refresh: () => loadOrders(shopId, status) };
}

export function useDashboard(shopId: string) {
  const stats = useShopStore((s) => s.dashboardStats);
  const loading = useShopStore((s) => s.dashboardLoading);
  const loadDashboard = useShopStore((s) => s.loadDashboard);

  useEffect(() => {
    if (shopId) loadDashboard(shopId);
  }, [shopId]);

  return { stats, loading, refresh: () => loadDashboard(shopId) };
}

export function useCart() {
  const cart = useShopStore((s) => s.cart);
  const addToCart = useShopStore((s) => s.addToCart);
  const removeFromCart = useShopStore((s) => s.removeFromCart);
  const updateCartQuantity = useShopStore((s) => s.updateCartQuantity);
  const clearCart = useShopStore((s) => s.clearCart);
  const total = useShopStore((s) => s.cartTotal());
  const itemCount = useShopStore((s) => s.cartItemCount());

  return { cart, addToCart, removeFromCart, updateCartQuantity, clearCart, total, itemCount };
}

export function usePOSSession(shopId: string) {
  const posSession = useShopStore((s) => s.posSession);
  const setPosSession = useShopStore((s) => s.setPosSession);
  const [loading, setLoading] = useState(false);

  const openSession = async (staffId: string, openingCash: number) => {
    setLoading(true);
    try {
      const session = await ShopService.openPosSession(shopId, staffId, openingCash);
      setPosSession(session);
      return session;
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async (closingCash: number, notes?: string) => {
    if (!posSession) throw new Error("No active session");
    setLoading(true);
    try {
      const session = await ShopService.closePosSession(posSession.id, closingCash, notes);
      setPosSession(null);
      return session;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ShopService.getActivePosSession(shopId).then((s) => {
      if (s) setPosSession(s);
    });
  }, [shopId]);

  return { posSession, openSession, closeSession, loading };
}
