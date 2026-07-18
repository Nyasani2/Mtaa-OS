import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useHospitalInventory(facilityId: string | null) {
  const { supabase } = useSupabase();
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!facilityId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: inv } = await supabase.from('health_inventory').select('*').eq('facility_id', facilityId).order('name', { ascending: true });
      setItems(inv || []);
      const { data: al } = await supabase.from('health_inventory_alerts').select('*').eq('facility_id', facilityId).eq('status', 'active').order('created_at', { ascending: false });
      setAlerts(al || []);
      const { data: tx } = await supabase.from('health_inventory_transactions').select('*').eq('facility_id', facilityId).order('created_at', { ascending: false }).limit(50);
      setTransactions(tx || []);
    } finally { setLoading(false); }
  }, [facilityId, supabase]);

  const addItem = useCallback(async (payload: any) => {
    if (!facilityId) return;
    const { error } = await supabase.from('health_inventory').insert({ ...payload, facility_id: facilityId });
    if (!error) fetchData();
  }, [facilityId, supabase, fetchData]);

  const updateStock = useCallback(async (id: string, newQty: number) => {
    const { error } = await supabase.from('health_inventory').update({ quantity: newQty }).eq('id', id);
    if (!error) fetchData();
  }, [supabase, fetchData]);

  const dispenseItem = useCallback(async (itemId: string, quantity: number, patientId: string, notes: string = '') => {
    if (!facilityId || !user) return { success: false, error: 'Missing facility or user' };
    try {
      const { data, error } = await supabase.rpc('dispense_and_bill', { p_inventory_item_id: itemId, p_patient_id: patientId, p_quantity: quantity, p_prescription_id: null, p_dispensed_by: user.id, p_facility_id: facilityId });
      if (error) throw error;
      fetchData();
      return { success: true, ...data };
    } catch (err: any) { return { success: false, error: err.message }; }
  }, [facilityId, user, supabase, fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { items, alerts, transactions, loading, addItem, updateStock, dispenseItem };
}
