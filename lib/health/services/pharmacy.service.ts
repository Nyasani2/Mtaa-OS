
import { supabase } from '@/lib/supabase/client';

export const pharmacyService = {
  async getInventory(facilityId: string) {
    const { data, error } = await supabase.from('health_pharmacy_inventory').select('*').eq('facility_id', facilityId).order('name');
    if (error) throw error;
    return data || [];
  },
  async addInventoryItem(itemData: any) {
    const { error } = await supabase.from('health_pharmacy_inventory').insert(itemData);
    if (error) throw error;
  },
  async updateInventoryItem(itemId: string, itemData: any) {
    const { error } = await supabase.from('health_pharmacy_inventory').update(itemData).eq('id', itemId);
    if (error) throw error;
  },
  async deleteInventoryItem(itemId: string) {
    const { error } = await supabase.from('health_pharmacy_inventory').delete().eq('id', itemId);
    if (error) throw error;
  },
  async getSuppliers(facilityId: string) {
    const { data, error } = await supabase.from('health_pharmacy_suppliers').select('*').eq('facility_id', facilityId).order('name');
    if (error) throw error;
    return data || [];
  },
  async addSupplier(supplierData: any) {
    const { error } = await supabase.from('health_pharmacy_suppliers').insert(supplierData);
    if (error) throw error;
  },
  async getPendingPrescriptions(facilityId: string) {
    const { data, error } = await supabase.from('health_prescriptions').select('*, patient:patient_id(name), doctor:doctor_id(name), items:health_prescription_items(*)').eq('facility_id', facilityId).eq('status', 'pending').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((p: any) => ({ ...p, patient_name: p.patient?.name, doctor_name: p.doctor?.name }));
  },
  async dispensePrescription(prescriptionId: string, dispenseData: any) {
    const { error } = await supabase.from('health_prescriptions').update({ status: 'dispensed', ...dispenseData, dispensed_at: new Date().toISOString() }).eq('id', prescriptionId);
    if (error) throw error;
  },
  async processSale(saleData: any, items: any[]) {
    const { data: sale, error: saleError } = await supabase.from('health_pharmacy_sales').insert({ ...saleData, status: 'completed', created_at: new Date().toISOString() }).select().single();
    if (saleError) throw saleError;
    for (const item of items) {
      await supabase.from('health_pharmacy_sale_items').insert({ sale_id: sale.id, inventory_id: item.id, name: item.name, quantity: item.quantity, unit_price: item.price, total: item.price * item.quantity });
      await supabase.rpc('decrement_inventory', { item_id: item.id, qty: item.quantity });
    }
    return sale;
  },
  async checkInteraction(drugA: string, drugB: string) {
    const { data } = await supabase.from('health_drug_interactions').select('*').or(`and(drug_a.ilike.${drugA},drug_b.ilike.${drugB}),and(drug_a.ilike.${drugB},drug_b.ilike.${drugA})`).single();
    if (data) return data;
    return { severity: 'none', description: `No known interaction.`, recommendation: 'Monitor patient.' };
  },
};
