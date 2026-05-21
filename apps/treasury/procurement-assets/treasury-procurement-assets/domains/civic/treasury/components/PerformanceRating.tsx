'use client'
import { Star } from 'lucide-react'

export default function PerformanceRating({ rating, onRate }: { rating?: number; onRate?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} onClick={() => onRate?.(star)}
          className={`${star <= (rating || 0) ? 'text-amber-500' : 'text-gray-300'} hover:text-amber-500 transition-colors`}>
          <Star size={16} fill={star <= (rating || 0) ? 'currentColor' : 'none'}/>
        </button>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating ? rating.toFixed(1) : 'N/A'}</span>
    </div>
  )
}
