// lib/services/business-service.ts
// FIXED: Removed duplicate supabase import, fixed handleServiceError returns

import { supabase } from '@/lib/supabase';
import { ServiceResult, handleServiceError } from '@/lib/utils/service-helpers';

export interface Shop {
  id: string;
  name: string;
  owner_id: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

export interface ShopStaff {
  id: string;
  shop_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
}

export interface ShopSupplier {
  id: string;
  shop_id: string;
  name: string;
  contact?: string;
  email?: string;
  created_at: string;
}

export interface BusinessDocument {
  id: string;
  shop_id: string;
  type: string;
  url: string;
  created_at: string;
}

export async function createShop(payload: Partial<Shop>): Promise<ServiceResult<Shop>> {
  try {
    const { data, error } = await supabase.from('shops').insert(payload).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getShopById(shopId: string): Promise<ServiceResult<Shop>> {
  try {
    const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getShopsByOwner(ownerId: string): Promise<ServiceResult<Shop[]>> {
  try {
    const { data, error } = await supabase.from('shops').select('*').eq('owner_id', ownerId);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function updateShop(shopId: string, updates: Partial<Shop>): Promise<ServiceResult<Shop>> {
  try {
    const { data, error } = await supabase.from('shops').update(updates).eq('id', shopId).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function deleteShop(shopId: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('shops').delete().eq('id', shopId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getShopStaff(shopId: string): Promise<ServiceResult<ShopStaff[]>> {
  try {
    const { data, error } = await supabase.from('shop_staff').select('*').eq('shop_id', shopId);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function addShopStaff(shopId: string, staffData: Partial<ShopStaff>): Promise<ServiceResult<ShopStaff>> {
  try {
    const { data, error } = await supabase.from('shop_staff').insert({ ...staffData, shop_id: shopId }).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function removeShopStaff(staffId: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('shop_staff').delete().eq('id', staffId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getShopSuppliers(shopId: string): Promise<ServiceResult<ShopSupplier[]>> {
  try {
    const { data, error } = await supabase.from('shop_suppliers').select('*').eq('shop_id', shopId);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function addShopSupplier(shopId: string, supplierData: Partial<ShopSupplier>): Promise<ServiceResult<ShopSupplier>> {
  try {
    const { data, error } = await supabase.from('shop_suppliers').insert({ ...supplierData, shop_id: shopId }).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function updateShopSupplier(supplierId: string, updates: Partial<ShopSupplier>): Promise<ServiceResult<ShopSupplier>> {
  try {
    const { data, error } = await supabase.from('shop_suppliers').update(updates).eq('id', supplierId).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function getShopDocuments(shopId: string): Promise<ServiceResult<BusinessDocument[]>> {
  try {
    const { data, error } = await supabase.from('shop_documents').select('*').eq('shop_id', shopId);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function uploadShopDocument(shopId: string, docData: Partial<BusinessDocument>): Promise<ServiceResult<BusinessDocument>> {
  try {
    const { data, error } = await supabase.from('shop_documents').insert({ ...docData, shop_id: shopId }).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function deleteShopDocument(docId: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('shop_documents').delete().eq('id', docId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}
