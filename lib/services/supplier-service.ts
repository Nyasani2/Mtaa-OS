import { supabase } from '@/lib/supabase';

export interface Supplier {
  id: string;
  shop_id: string;
  name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
}

export class SupplierService {
  async createSupplier(shopId: string, data: Partial<Supplier>) {
    try {
      const { data: supplier, error } = await supabase
        .from('shop_suppliers')
        .insert({
          shop_id: shopId,
          name: data.name,
          contact_person: data.contact_person,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          payment_terms: data.payment_terms || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return supplier;
    } catch (error: any) {
      console.error('createSupplier error:', error);
      throw new Error(error?.message || 'Failed to create supplier');
    }
  }

  async getSuppliers(shopId: string): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('shop_suppliers')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('getSuppliers error:', error);
      return [];
    }
  }

  async updateSupplier(supplierId: string, updates: Partial<Supplier>) {
    try {
      const { error } = await supabase
        .from('shop_suppliers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplierId);

      if (error) throw error;
    } catch (error: any) {
      console.error('updateSupplier error:', error);
      throw new Error(error?.message || 'Failed to update supplier');
    }
  }

  async deleteSupplier(supplierId: string) {
    try {
      const { error } = await supabase
        .from('shop_suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;
    } catch (error: any) {
      console.error('deleteSupplier error:', error);
      throw new Error(error?.message || 'Failed to delete supplier');
    }
  }
}

export const supplierService = new SupplierService();
