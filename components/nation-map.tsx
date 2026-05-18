"use client";

import { useState } from "react";

export default function NationMap() {
  const [view, setView] = useState("africa");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm text-zinc-400">
          Nation Intelligence Map
        </h2>

        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
          className="bg-black border border-white/10 text-sm px-3 py-1 rounded-lg"
        >
          <option value="africa">Africa View</option>
          <option value="kenya">Kenya Drill</option>
          <option value="county">County Layer</option>
        </select>
      </div>

      {view === "africa" && (
        <div className="text-center text-zinc-500 py-20">
          🌍 Africa Macro Economic + Civic Grid
        </div>
      )}

      {view === "kenya" && (
        <div className="text-center text-blue-400 py-20">
          🇰🇪 Kenya National Systems Active
        </div>
      )}

      {view === "county" && (
        <div className="text-center text-green-400 py-20">
          🏙️ County-Level Governance Layer Active
        </div>
      )}

    </div>
  );
}
