'use client'
import { useEffect, useState } from 'react'
import { TreasuryAsset, AssetTransfer } from '../types/procurement.types'
import { fetchAssets, createAsset, updateAssetCondition, transferCustody, approveTransfer, completeTransfer } from '../services/assetService'

export function useAssets() {
  const [assets, setAssets] = useState<TreasuryAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAssets().then(setAssets).finally(() => setLoading(false)) }, [])

  const create = async (asset: Omit<TreasuryAsset, 'id' | 'net_book_value' | 'accumulated_depreciation' | 'created_at'>) => {
    const created = await createAsset(asset)
    setAssets(prev => [created, ...prev])
    return created
  }

  const updateCondition = async (id: string, condition: TreasuryAsset['condition']) => {
    await updateAssetCondition(id, condition)
    setAssets(prev => prev.map(a => a.id === id ? { ...a, condition } : a))
  }

  const transfer = async (t: Omit<AssetTransfer, 'id' | 'created_at'>) => {
    const created = await transferCustody(t)
    return created
  }

  const approve = async (id: string, approverId: string) => {
    await approveTransfer(id, approverId)
  }

  const complete = async (id: string) => {
    await completeTransfer(id)
  }

  return { assets, loading, create, updateCondition, transfer, approveTransfer: approve, completeTransfer: complete }
}
