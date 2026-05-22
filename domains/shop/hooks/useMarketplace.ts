import { useState, useEffect, useCallback } from "react";
import { ShopService } from "../services/shopService";
import { supabase } from '@/lib/supabase';

export function useMarketplaceSearch(query: string, category?: string) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(() => {
    setLoading(true);
    setError(null);
    ShopService.searchMarketplace(query, category)
      .then(setListings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query, category]);

  useEffect(() => {
    search();
  }, [search]);

  return { listings, loading, error, search };
}

export function useShopMessages(shopId: string, customerId?: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('shop_messages')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: true });
      if (!error) setMessages(data || []);
      setLoading(false);
    };
    fetchMessages();

    const channel = supabase
      .channel(`shop_messages:${shopId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shop_messages', filter: `shop_id=eq.${shopId}` }, (payload: any) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shopId]);

  const sendMessage = useCallback(async (content: string, senderId: string) => {
    const { error } = await supabase.from('shop_messages').insert({
      shop_id: shopId,
      customer_id: customerId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  }, [shopId, customerId]);

  return { messages, loading, sendMessage };
}
