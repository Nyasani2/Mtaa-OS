import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useShop() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('shop_items').select('*').limit(50);
    if (!error) setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  return { products, loading, fetchProducts };
}
