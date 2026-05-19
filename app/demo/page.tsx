"use client";

import { useMemo, useState } from "react";
import { counties } from "@/lib/civic/counties";
import { civicEvents } from "@/lib/civic/events";
import { processEvents, getNationalSummary } from "@/lib/civic/eventProcessor";

type View = "citizen" | "county" | "president" | "hospital" | "bank";

export default function DemoPage() {
  const [view, setView] = useState<View>("citizen");

  const state = useMemo(() => {
    return processEvents(civicEvents);
  }, []);

  const national = useMemo(() => {
    return getNationalSummary(civicEvents);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4">

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

      {view === "citizen" && (
        <div className="space-y-4">
          <div className="bg-zinc-900 p-4 rounded-2xl">
            <h2 className="font-semibold">👤 Citizen OS</h2>
            <p className="text-sm text-zinc-400">
              Report issues, pay services, track government response
            </p>
          </div>
        </div>
      )}

      {view === "county" && (
        <div className="space-y-4">
          {counties.map((c) => {
            const s = state[c.id];

            return (
              <div key={c.id} className="bg-zinc-900 p-4 rounded-2xl">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-sm text-zinc-400">
                  Total Revenue: KES{" "}
                  {(
                    s.revenue.parking +
                    s.revenue.markets +
                    s.revenue.transport +
                    s.revenue.permits
                  ).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {view === "president" && (
        <div className="space-y-4">
          <div className="bg-zinc-900 p-4 rounded-2xl">
            <h3 className="font-semibold">📊 National Summary</h3>
            <p>Total Revenue: KES {national.totalRevenue.toLocaleString()}</p>
            <p>Total Issues: {national.totalIssues}</p>
          </div>
        </div>
      )}

      {view === "hospital" && (
        <div className="bg-zinc-900 p-4 rounded-2xl">
          Hospital Command Center
        </div>
      )}

      {view === "bank" && (
        <div className="bg-zinc-900 p-4 rounded-2xl">
          Financial Command Center
        </div>
      )}
    </div>
  );
}
