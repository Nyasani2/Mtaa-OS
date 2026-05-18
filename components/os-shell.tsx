"use client";

import { useState } from "react";
import ModeSwitcher from "./mode-switcher";

export default function OSShell({ children }: any) {
  const [mode, setMode] = useState("social");

  return (
    <div className="relative">

      <ModeSwitcher onChange={setMode} />

      <div className="transition-all duration-700">

        {mode === "social" && (
          <div className="border border-cyan-500/20 rounded-3xl p-6 bg-cyan-500/5">
            <h2 className="text-cyan-400 text-sm mb-2">SOCIAL MODE</h2>
            {children}
          </div>
        )}

        {mode === "economy" && (
          <div className="border border-green-500/20 rounded-3xl p-6 bg-green-500/5">
            <h2 className="text-green-400 text-sm mb-2">ECONOMIC MODE</h2>
            {children}
          </div>
        )}

        {mode === "civic" && (
          <div className="border border-orange-500/20 rounded-3xl p-6 bg-orange-500/5">
            <h2 className="text-orange-400 text-sm mb-2">CIVIC MODE</h2>
            {children}
          </div>
        )}

        {mode === "investor" && (
          <div className="border border-purple-500/20 rounded-3xl p-6 bg-purple-500/5">
            <h2 className="text-purple-400 text-sm mb-2">INVESTOR VIEW</h2>
            {children}
          </div>
        )}

      </div>

    </div>
  );
}
