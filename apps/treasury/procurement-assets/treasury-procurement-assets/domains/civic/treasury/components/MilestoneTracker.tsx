'use client'
import { CheckCircle, Circle, Clock } from 'lucide-react'

interface Milestone { label: string; completed: boolean; date?: string }

export default function MilestoneTracker({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="flex items-center gap-2">
      {milestones.map((m, i) => (
        <div key={i} className="flex items-center gap-2">
          {m.completed ? (
            <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle size={12}/> {m.label}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              <Circle size={12}/> {m.label}
            </div>
          )}
          {i < milestones.length - 1 && <div className="w-4 h-px bg-gray-300"/>}
        </div>
      ))}
    </div>
  )
}
