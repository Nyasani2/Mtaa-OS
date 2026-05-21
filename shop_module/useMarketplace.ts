// lib/shop/hooks/useMarketplace.ts
import { useState, useEffect, useCallback } from "react";
import { ShopService } from "../services/shopService";
import { MarketplaceListing } from "../types";

export function useMarketplaceSearch() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: { query?: string; category?: string; lat?: number; lng?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const results = await ShopService.searchMarketplace(params.query, params.category, params.lat, params.lng);
      setListings(results);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { listings, loading, error, search };
}

export function useShopMessages(shopId: string, customerId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId && customerId) {
      ShopService.getMessages(shopId, customerId).then(setMessages).finally(() => setLoading(false));
      const subscription = ShopService.subscribeToMessages(shopId, customerId, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      });
      return () => { subscription.unsubscribe(); };
    }
  }, [shopId, customerId]);

  const sendMessage = async (message: string, senderType: "customer" | "shop" = "customer", productId?: string, orderId?: string) => {
    await ShopService.sendMessage(shopId, customerId, message, senderType, productId, orderId);
  };

  return { messages, loading, sendMessage };
}
