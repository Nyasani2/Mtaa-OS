// domains/shop/hooks/useMarketplace.ts
import { useState, useEffect, useCallback } from 'react';
import { shopService, ShopProduct } from '../services/shopService';

export function useMarketplace() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shopService.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return { products, loading, error, refresh: loadProducts };
}

export function useMarketplaceSearch() {
  const [results, setResults] = useState<ShopProduct[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const all = await shopService.getProducts();
    const filtered = all.filter(p => 
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.description?.toLowerCase().includes(q.toLowerCase())
    );
    setResults(filtered);
    setLoading(false);
  }, []);

  return { results, query, loading, search };
}

export function useShopMessages() {
  const [messages, setMessages] = useState<{ id: string; text: string; sender: string; timestamp: string }[]>([]);
  const sendMessage = (text: string, sender: string) => {
    setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), text, sender, timestamp: new Date().toISOString() }]);
  };
  return { messages, sendMessage };
}
