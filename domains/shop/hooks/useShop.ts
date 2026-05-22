import { useEffect, useState, useCallback } from "react";
import { useShopStore } from "../state/shopStore";
import { ShopService } from "../services/shopService";
import { AccountingService } from "../services/accountingService";
import { Shop } from "../types";

export function useShop(shopId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentShop = useShopStore((s) => s.currentShop);
  const setCurrentShop = useShopStore((s) => s.setCurrentShop);

  useEffect(() => {
    if (shopId && (!currentShop || currentShop.id !== shopId)) {
      setLoading(true);
      setError(null);
      ShopService.getShopById(shopId)
        .then((shop) => {
          if (shop) setCurrentShop(shop);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [shopId, currentShop, setCurrentShop]);

  return { shop: currentShop, loading, error };
}

export function useMyShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    ShopService.getMyShops()
      .then(setShops)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { shops, loading, error, refresh };
}

export function useShopProducts(shopId: string, options?: { category?: string; search?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    ShopService.getProducts(shopId)
      .then((data) => {
        let filtered = data;
        if (options?.category) filtered = filtered.filter((p: any) => p.category === options.category);
        if (options?.search) filtered = filtered.filter((p: any) => p.name?.toLowerCase().includes(options.search!.toLowerCase()));
        setProducts(filtered);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shopId, options?.category, options?.search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { products, loading, error, refresh };
}

export function useShopOrders(shopId: string, status?: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    ShopService.getOrders(shopId, status)
      .then(setOrders)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shopId, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { orders, loading, error, refresh };
}

export function usePOSSession(shopId: string) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    ShopService.getActivePosSession(shopId)
      .then(setSession)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shopId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openSession = useCallback(async (cashierId: string) => {
    const newSession = await ShopService.openPosSession(shopId, cashierId);
    setSession(newSession);
    return newSession;
  }, [shopId]);

  const closeSession = useCallback(async () => {
    if (!session) return;
    await ShopService.closePosSession(session.id);
    setSession(null);
  }, [session]);

  return { session, loading, error, openSession, closeSession, refresh };
}

export function useDashboard(shopId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [products, orders, accounts] = await Promise.all([
          ShopService.getProducts(shopId),
          ShopService.getOrders(shopId),
          AccountingService.getAccounts(shopId)
        ]);
        setData({
          products: products.length,
          orders: orders.length,
          revenue: accounts.reduce((s: number, a: any) => s + (a.balance || 0), 0)
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [shopId]);

  return { data, loading, error };
}
