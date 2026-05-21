'use client'
import { useDashboard } from '../hooks/useDashboard'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CashFlowChart() {
  const { data, loading } = useDashboard()

  if (loading) return <div className="h-80 bg-gray-100 rounded-lg animate-pulse"/>

  const chartData = data?.recent_transactions?.slice(0, 7).map(tx => ({
    date: new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: tx.amount,
    type: tx.type
  })) || []

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Cash Flow Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
          <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8"/>
          <YAxis tick={{fontSize: 12}} stroke="#94a3b8" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}/>
          <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Amount']}/>
          <Area type="monotone" dataKey="amount" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorAmount)"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
