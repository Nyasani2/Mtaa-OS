'use client'
import { useCommandStore } from '@/domains/civic/treasury/state/commandStore'
import { useEffect } from 'react'
import FeedbackForm from '@/domains/civic/treasury/components/FeedbackForm'

export default function FeedbackPage() {
  const { setActiveModule } = useCommandStore()
  useEffect(() => { setActiveModule('feedback') }, [setActiveModule])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900">Feedback & Support</h2>
        <p className="text-gray-500 mt-1">Submit issues, feature requests, or get help.</p>
      </div>
      <div className="max-w-2xl">
        <FeedbackForm/>
      </div>
    </div>
  )
}
