import { supabase } from '@/lib/supabase/client'
import { TreasuryAsset, AssetTransfer } from '../types/procurement.types'

export async function fetchAssets(): Promise<TreasuryAsset[]> {
  const { data, error } = await supabase.from('treasury_assets').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createAsset(asset: Omit<TreasuryAsset, 'id' | 'net_book_value' | 'accumulated_depreciation' | 'created_at'>): Promise<TreasuryAsset> {
  const { data, error } = await supabase.from('treasury_assets').insert({ ...asset, accumulated_depreciation: 0 }).select().single()
  if (error) throw error
  return data
}

export async function updateAssetCondition(id: string, condition: TreasuryAsset['condition']): Promise<void> {
  const { error } = await supabase.from('treasury_assets').update({ condition }).eq('id', id)
  if (error) throw error
}

export async function transferCustody(transfer: Omit<AssetTransfer, 'id' | 'created_at'>): Promise<AssetTransfer> {
  const { data, error } = await supabase.from('treasury_asset_transfers').insert(transfer).select().single()
  if (error) throw error
  return data
}

export async function approveTransfer(id: string, approverId: string): Promise<void> {
  const { error } = await supabase.from('treasury_asset_transfers').update({
    status: 'approved', approved_by: approverId
  }).eq('id', id)
  if (error) throw error
}

export async function completeTransfer(id: string): Promise<void> {
  const { error } = await supabase.from('treasury_asset_transfers').update({ status: 'completed' }).eq('id', id)
  if (error) throw error
}
