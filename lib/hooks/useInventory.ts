import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const QUERY_TIMEOUT = 10000;

export interface InventoryItem {
  id: string;
  garage_id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  unit: string;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
  reorder_quantity: number;
  supplier_id: string | null;
  supplier_name: string;
  supplier_phone: string;
  location: string;
  barcode: string;
  image_url: string;
  is_active: boolean;
  last_restocked_at: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryFilters {
  category?: string;
  lowStock?: boolean;
  search?: string;
}

export interface UseInventoryState {
  items: InventoryItem[];
  categories: string[];
  lowStockCount: number;
  totalValue: number;
  isLoading: boolean;
  error: string | null;
}

export function useInventory(garageId?: string) {
  const { user } = useAuthStore();
  const [state, setState] = useState<UseInventoryState>({
    items: [],
    categories: [],
    lowStockCount: 0,
    totalValue: 0,
    isLoading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading, error: null }));
  }, []);

  const setError = useCallback((err: any) => {
    const message = err?.message || String(err);
    const isMissingTable = message.includes('does not exist') || message.includes('relation');
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: isMissingTable ? null : message,
    }));
  }, []);

  // Load inventory items
  const loadInventory = useCallback(async (filters?: InventoryFilters) => {
    if (!garageId && !user?.id) {
      setState(prev => ({ ...prev, items: [], isLoading: false }));
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('garage_inventory')
        .select('*')
        .eq('is_active', true);

      if (garageId) {
        query = query.eq('garage_id', garageId);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.lowStock) {
        query = query.lte('quantity', supabase.rpc('get_reorder_level'));
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('name');

      if (error) {
        // If table doesn't exist, return empty gracefully
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setState(prev => ({
            ...prev,
            items: [],
            categories: [],
            lowStockCount: 0,
            totalValue: 0,
            isLoading: false,
            error: null,
          }));
          return;
        }
        throw error;
      }

      const items = (data || []) as InventoryItem[];
      const categories = [...new Set(items.map(i => i.category))];
      const lowStockCount = items.filter(i => i.quantity <= i.reorder_level).length;
      const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.cost_price), 0);

      setState(prev => ({
        ...prev,
        items,
        categories,
        lowStockCount,
        totalValue,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError(err);
    }
  }, [garageId, user?.id, setLoading, setError]);

  // Add inventory item
  const addItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('garage_inventory')
        .insert(item)
        .select()
        .maybeSingle();

      if (error) throw error;
      await loadInventory();
      return data as InventoryItem;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadInventory, setError]);

  // Update item
  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { data, error } = await supabase
        .from('garage_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      await loadInventory();
      return data as InventoryItem;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadInventory, setError]);

  // Delete item (soft delete)
  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('garage_inventory')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      await loadInventory();
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadInventory, setError]);

  // Load on mount when garageId changes
  useEffect(() => {
    loadInventory();
  }, [garageId, loadInventory]);

  return {
    ...state,
    loadInventory,
    addItem,
    updateItem,
    deleteItem,
  };
}

export default useInventory;
