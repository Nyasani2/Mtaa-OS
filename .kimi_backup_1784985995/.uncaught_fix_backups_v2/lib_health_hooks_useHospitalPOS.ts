import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface CartItem { id: string; name: string; type: string; price: number; quantity: number; }

export function useHospitalPOS(facilityId: string | null) {
  const { user } = useAuthStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => { const existing = prev.find(i => i.id === item.id); if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i); return [...prev, item]; });
  }, []);

  const removeFromCart = useCallback((id: string) => { setCart(prev => prev.filter(i => i.id !== id)); }, []);

  const updateQuantity = useCallback((id: string, qty: number) => { if (qty <= 0) { removeFromCart(id); return; } setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i)); }, [removeFromCart]);

  const checkout = useCallback(async (payload: any) => {
    if (!facilityId || !user) return { success: false, error: 'No facility or user' };
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('process_hospital_payment', {
        p_facility_id: facilityId, p_patient_id: payload.patient_id, p_amount: payload.items.reduce((s: number, i: any) => s + i.total, 0),
        p_method: payload.payment_method, p_items: JSON.stringify(payload.items), p_processed_by: user.id
      });
      if (error) throw error;
      setCart([]);
      return { success: true, ...data };
    } catch (err: any) { return { success: false, error: err.message }; }
    finally { setLoading(false); }
  }, [facilityId, user, supabase]);

  return { session, cart, addToCart, removeFromCart, updateQuantity, checkout, loading };
}
