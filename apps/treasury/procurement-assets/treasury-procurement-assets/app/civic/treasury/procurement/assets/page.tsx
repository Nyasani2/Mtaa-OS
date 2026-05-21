'use client'
import AssetRegister from '@/domains/civic/treasury/components/AssetRegister'
import DepreciationChart from '@/domains/civic/treasury/components/DepreciationChart'

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <DepreciationChart/>
      <AssetRegister/>
    </div>
  )
}
