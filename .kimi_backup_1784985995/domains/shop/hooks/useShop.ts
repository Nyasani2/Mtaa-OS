// domains/shop/hooks/useShop.ts
import { useState, useEffect, useCallback } from 'react';
import { shopService, Shop, ShopProduct, ShopOrder } from '../services/shopService';

export function useShop(shopId?: string) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShop = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const data = await shopService.getShopById(shopId);
      setShop(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  return { shop, loading, error, refresh: loadShop };
}

export function useShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShops = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shopService.getShops();
      setShops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  return { shops, loading, error, refresh: loadShops };
}

export function useMyShops() {
  return useShops(); // Alias for backward compatibility
}

export function useShopProducts(shopId?: string) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    const data = await shopService.getProducts(shopId);
    setProducts(data);
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return { products, loading, refresh: loadProducts };
}

export function useShopOrders(shopId?: string, customerId?: string) {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const data = await shopService.getOrders(shopId, customerId);
    setOrders(data);
    setLoading(false);
  }, [shopId, customerId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return { orders, loading, refresh: loadOrders };
}

export function usePOSSession() {
  const [session, setSession] = useState<{ id: string; shopId: string; startedAt: string } | null>(null);
  const startSession = (shopId: string) => {
    setSession({ id: Math.random().toString(36).slice(2), shopId, startedAt: new Date().toISOString() });
  };
  const endSession = () => setSession(null);
  return { session, startSession, endSession };
}
