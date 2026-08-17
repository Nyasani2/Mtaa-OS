// domains/shop/hooks/useShop.ts
// Canonical shop hooks — aligned with domains/shop/services/shopService.ts

import { useState, useEffect, useCallback } from 'react';
import { shopService, Shop, ShopProduct, ShopOrder, ShopStaff } from '../services/shopService';

export function useShop(shopId?: string) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShop = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
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
    setError(null);
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

export function useMyShops(ownerId?: string) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await shopService.getShopsByOwner(ownerId);
      setShops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load my shops');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { shops, loading, error, refresh: load };
}

export function useShopProducts(shopId?: string) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await shopService.getProducts(shopId);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return { products, loading, error, refresh: loadProducts };
}

export function useShopOrders(shopId?: string, customerId?: string) {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shopService.getOrders(shopId, customerId);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [shopId, customerId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return { orders, loading, error, refresh: loadOrders };
}

export function useShopStaff(shopId?: string) {
  const [staff, setStaff] = useState<ShopStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await shopService.getShopStaff(shopId);
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  return { staff, loading, error, refresh: load };
}

export function usePOSSession() {
  const [session, setSession] = useState<{ id: string; shopId: string; startedAt: string } | null>(null);

  const startSession = useCallback((shopId: string) => {
    setSession({
      id: Math.random().toString(36).slice(2),
      shopId,
      startedAt: new Date().toISOString(),
    });
  }, []);

  const endSession = useCallback(() => setSession(null), []);

  return { session, startSession, endSession };
}
