import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert } from 'react-native';

export interface InventoryItem {
  id: string;
  shop_id: string;
  item_id: string;
  quantity: number;
  low_stock_threshold: number;
  warehouse_location: string | null;
  last_restocked: string | null;
  updated_at: string;
}

export function useShopInventory(shopId?: string) {
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('shop_inventory')
        .select('*')
        .eq('shop_id', shopId)
        .order('updated_at', { ascending: false });
      if (err) throw err;
      setInventory(data || []);
      setLowStockItems((data || []).filter((i: any) => i.quantity <= i.low_stock_threshold));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const restock = useCallback(async (itemId: string, amount: number) => {
    if (!user || !shopId) return false;
    try {
      const { data: existing, error: findErr } = await supabase
        .from('shop_inventory')
        .select('*')
        .eq('shop_id', shopId)
        .eq('item_id', itemId)
        .single();
      if (findErr && findErr.code !== 'PGRST116') throw findErr;

      if (existing) {
        const { data, error: err } = await supabase
          .from('shop_inventory')
          .update({
            quantity: existing.quantity + amount,
            last_restocked: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (err) throw err;
        setInventory(prev => prev.map(i => i.id === existing.id ? data : i));
      } else {
        const { data, error: err } = await supabase
          .from('shop_inventory')
          .insert({
            shop_id: shopId,
            item_id: itemId,
            quantity: amount,
            low_stock_threshold: 10,
            last_restocked: new Date().toISOString(),
          })
          .select()
          .single();
        if (err) throw err;
        setInventory(prev => [data, ...prev]);
      }
      fetchInventory();
      return true;
    } catch (err: any) {
      Alert.alert('Error', err.message);
      return false;
    }
  }, [user, shopId, fetchInventory]);

  return {
    inventory,
    lowStockItems,
    loading,
    fetchInventory,
    restock,
    user,
  };
}
