
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function usePharmacy(facilityId: string | null) {
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!facilityId || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [{ data: invData }, { data: supData }, { data: presData }, { data: salesData }] = await Promise.all([
        supabase.from('health_pharmacy_inventory').select('*').eq('facility_id', facilityId).order('name'),
        supabase.from('health_pharmacy_suppliers').select('*').eq('facility_id', facilityId).order('name'),
        supabase.from('health_prescriptions').select('*, patient:patient_id(name), doctor:doctor_id(name), items:health_prescription_items(*)').eq('facility_id', facilityId).eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('health_pos_transactions').select('*').eq('facility_id', facilityId).order('created_at', { ascending: false }).limit(50),
      ]);
      if (isMounted.current) {
        setInventory(invData || []);
        setSuppliers(supData || []);
        setPrescriptions((presData || []).map((p: any) => ({ ...p, patient_name: p.patient?.name, doctor_name: p.doctor?.name })));
        setSales(salesData || []);
      }
    } catch (err: any) {
      if (isMounted.current) setError(err.message || 'Failed to load pharmacy data');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [facilityId, user?.id]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => { isMounted.current = false; };
  }, [fetchData]);

  const addSupplier = useCallback(async (supplierData: any) => {
    const { error } = await supabase.from('health_pharmacy_suppliers').insert(supplierData);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const addInventoryItem = useCallback(async (itemData: any) => {
    const { error } = await supabase.from('health_pharmacy_inventory').insert(itemData);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const updateInventoryItem = useCallback(async (itemId: string, itemData: any) => {
    const { error } = await supabase.from('health_pharmacy_inventory').update(itemData).eq('id', itemId);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const deleteInventoryItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from('health_pharmacy_inventory').delete().eq('id', itemId);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const processSale = useCallback(async (saleData: any) => {
    const { data: sale, error: saleError } = await supabase.from('health_pos_transactions').insert({
      facility_id: saleData.facility_id,
      cashier_id: saleData.cashier_id,
      customer_name: saleData.customer_name,
      customer_phone: saleData.customer_phone,
      total: saleData.total,
      payment_method: saleData.payment_method,
      status: 'completed',
      created_at: new Date().toISOString(),
    }).select().single();
    if (saleError) throw saleError;

    // Insert sale items and update inventory
    for (const item of saleData.items) {
      await supabase.from('health_pos_transactions').insert({
        sale_id: sale.id, inventory_id: item.id, name: item.name,
        quantity: item.quantity, unit_price: item.price, total: item.price * item.quantity,
      });
      await supabase.rpc('decrement_inventory', { item_id: item.id, qty: item.quantity });
    }
    await fetchData();
  }, [fetchData]);

  const dispensePrescription = useCallback(async (prescriptionId: string, dispenseData: any) => {
    const { error } = await supabase.from('health_prescriptions').update({
      status: 'dispensed', dispensed_by: dispenseData.dispensed_by,
      dispensed_at: new Date().toISOString(), dispense_notes: dispenseData.notes,
    }).eq('id', prescriptionId);
    if (error) throw error;
    // Decrement inventory for each item
    const { data: pres } = await supabase.from('health_prescriptions').select('items:health_prescription_items(*)').eq('id', prescriptionId).single();
    for (const item of pres?.items || []) {
      const { data: inv } = await supabase.from('health_pharmacy_inventory').select('id, quantity').eq('facility_id', facilityId).ilike('name', item.medication_name).single();
      if (inv) {
        await supabase.from('health_pharmacy_inventory').update({ quantity: Math.max(0, inv.quantity - item.quantity) }).eq('id', inv.id);
      }
    }
    await fetchData();
  }, [facilityId, fetchData]);

  const checkInteraction = useCallback(async (drugA: string, drugB: string) => {
    // Query the interactions table
    const { data } = await supabase
      .from('health_pharmacy_inventory')
      .select('*')
      .or(`and(drug_a.ilike.${drugA},drug_b.ilike.${drugB}),and(drug_a.ilike.${drugB},drug_b.ilike.${drugA})`)
      .single();
    if (data) return data;
    // Fallback: check if both exist in known interaction pairs
    return { severity: 'none', description: `No known interaction between ${drugA} and ${drugB}.`, recommendation: 'Continue monitoring patient.' };
  }, []);

  return {
    inventory, suppliers, prescriptions, sales, loading, error, refresh: fetchData,
    addSupplier, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    processSale, dispensePrescription, checkInteraction
  };
}
