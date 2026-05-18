'use client'

import { useMemo, useState } from 'react'
import { counties } from '@/lib/civic/counties'
import { civicEvents } from '@/lib/civic/events'
import { processEvents, getNationalSummary } from '@/lib/civic/eventProcessor'

type View = 'citizen' | 'county' | 'president' | 'hospital' | 'bank'

export default function DemoPage() {
  const [view, setView] = useState<View>('citizen')

  /**
   * 🧠 PROCESS LIVE SYSTEM STATE
   */
  const state = useMemo(() => {
    return processEvents(civicEvents)
  }, [])

  const national = useMemo(() => {
    return getNationalSummary(civicEvents)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">MTAA AFRIQ Command OS</h1>

        <select
          value={view}
          onChange={(e) => setView(e.target.value as View)}
          className="bg-zinc-900 p-2 rounded-lg text-sm"
        >
          <option value="citizen">Citizen View</option>
          <option value="county">County Command</option>
          <option value="president">Presidential Command</option>
          <option value="hospital">Hospital Command</option>
          <option value="bank">Bank / Revenue Command</option>
        </select>
      </div>

      {/* ================= CITIZEN ================= */}
      {view === 'citizen' && (
        <div className="space-y-4">

          <div className="bg-zinc-900 p-4 rounded-2xl">
            <h2 className="font-semibold">👤 Citizen OS</h2>
            <p className="text-sm text-zinc-400">
              Report issues, pay services, track government response
            </p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-2xl">
            <h3 className="font-semibold">🛣️ Streets System</h3>
            <p className="text-sm text-zinc-400">
              Civic reporting and infrastructure monitoring
            </p>
          </div>

          <div className="bg-zinc-900 p-4 rounded-2xl">
            <h3 className="font-semibold">💳 Wallet System</h3>
            <p className="text-sm text-zinc-400">
              Payments for parking, permits, and services
            </p>
          </div>

        </div>
      )}

      {/* ================= COUNTY ================= */}
      {view === 'county' && (
        <div className="space-y-4">

          <div className="bg-zinc-900 p-4 rounded-2xl">
            <h2 className="font-semibold">🏙️ County Command Center</h2>
            <p className="text-sm text-zinc-400">
              Live state driven by civic events
            </p>
          </div>

          {counties.map((c) => {
            const s = state[c.id]

            return (
              <div key={c.id} className="bg-zinc-900 p-4 rounded-2xl space-y-2">
                <h3 className="font-semibold">{c.name}</h3>

                <div className="text-sm text-zinc-300 space-y-1">
                  <p>🚗 Parking Revenue: KES {s.revenue.parking.toLocaleString()}</p>
                  <p>🏪 Market Revenue: KES {s.revenue.markets.toLocaleString()}</p>
                  <p>🚌 Transport Revenue: KES {s.revenue.transport.toLocaleString()}</p>
                  <p>🧾 Permit Revenue: KES {s.revenue.permits.toLocaleString()}</p>

                  <hr className="border-zinc-700 my-2" />

                  <p className="font-semibold">
                    💰 Total: KES{" "}
                    {(
                      s.revenue.parking +
                      s.revenue.markets +
                      s.revenue.transport +
                      s.revenue.permits
                    ).toLocaleString()}
                  </p>

                  <p className="text-xs text-zinc-400">
                    Active Issues: {s.issues}
                  </p>
                </div>
              </div>
            )
          })}

        </div>
      )}

      {/* ================= PRESIDENT ================= */}
      {view === 'president' && (
        <div className="space-y-4">

          <div className="bg-zinc-900 p-4 rounded-2xl">
            <h2 className="font-semibold">🇰🇪 National Command Center</h2>
            <p className="text-sm text-zinc-400">
              Event-driven national intelligence layer
            </p>
          </div>

          {/* NATIONAL METRICS */}
          <div className="bg-zinc-900 p-4 rounded-2xl space-y-1">
            <h3 className="font-semibold">📊 National Summary</h3>
            <p className="text-sm">Total Revenue: KES {national.totalRevenue.toLocaleString()}</p>
            <p className="text-sm">Total Issues: {national.totalIssues}</p>
            <p className="text-sm">Total Events: {national.eventCount}</p>
          </div>

          {/* COUNTY STATE */}
          <div className="bg-zinc-900 p-4 rounded-2xl space-y-3">
            <h3 className="font-semibold">🏙️ County Live State</h3>

            {counties.map((c) => {
              const s = state[c.id]

              return (
                <div key={c.id} className="border border-zinc-800 p-3 rounded-lg">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-zinc-300">
                    Revenue: KES{" "}
                    {(
                      s.revenue.parking +
                      s.revenue.markets +
                      s.revenue.transport +
                      s.revenue.permits
                    ).toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Issues: {s.issues}
                  </p>
                </div>
              )
            })}
          </div>

          {/* EVENT STREAM */}
          <div className="bg-zinc-900 p-4 rounded-2xl">
            <h3 className="font-semibold">📡 Live Civic Event Stream</h3>

            <div className="mt-2 space-y-2">
              {civicEvents.map((e) => (
                <div key={e.id} className="border border-zinc-800 p-2 rounded-lg text-sm">
                  <p className="font-semibold">{e.type}</p>
                  <p className="text-zinc-400">{e.description}</p>
                  {e.amount && (
                    <p className="text-xs text-zinc-300">
                      KES {e.amount.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ================= HOSPITAL ================= */}
      {view === 'hospital' && (
        <div className="bg-zinc-900 p-4 rounded-2xl">
          <h2 className="font-semibold">🏥 Hospital Command Center</h2>
        </div>
      )}

      {/* ================= BANK ================= */}
      {view === 'bank' && (
        <div className="bg-zinc-900 p-4 rounded-2xl">
          <h2 className="font-semibold">🏦 Financial Command Center</h2>
        </div>
      )}

    </div>
  )
}
