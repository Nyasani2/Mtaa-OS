'use client'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function VarianceIndicator({ variance }: { variance?: number }) {
  if (variance === undefined) return <span className="text-gray-400 text-xs">—</span>

  const isPositive = variance > 0
  const Icon = isPositive ? TrendingUp : variance < 0 ? TrendingDown : Minus

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
      isPositive ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-600'
    }`}>
      <Icon size={12}/> {isPositive ? '+' : ''}{variance.toFixed(1)}%
    </span>
  )
}
