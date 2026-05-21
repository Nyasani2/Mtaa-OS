'use client'
import { useAssets } from '../hooks/useAssets'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DepreciationChart() {
  const { assets, loading } = useAssets()

  if (loading) return <div className="h-64 bg-gray-100 rounded-lg animate-pulse"/>

  const data = assets.slice(0, 10).map(a => ({
    name: a.asset_name.slice(0, 15),
    cost: a.acquisition_cost,
    nbv: a.net_book_value,
    depreciation: a.accumulated_depreciation
  }))

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Asset Depreciation Overview</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
          <XAxis dataKey="name" tick={{fontSize: 11}} stroke="#94a3b8" angle={-45} textAnchor="end" height={60}/>
          <YAxis tick={{fontSize: 12}} stroke="#94a3b8" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}/>
          <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']}/>
          <Bar dataKey="cost" fill="#0ea5e9" name="Original Cost" radius={[4, 4, 0, 0]}/>
          <Bar dataKey="nbv" fill="#22c55e" name="Net Book Value" radius={[4, 4, 0, 0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
