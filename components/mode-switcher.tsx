"use client";

import { useState } from "react";

type Mode = "social" | "economy" | "civic" | "investor";

export default function ModeSwitcher({
  onChange,
}: {
  onChange: (mode: Mode) => void;
}) {
  const [active, setActive] = useState<Mode>("social");

  const setMode = (mode: Mode) => {
    setActive(mode);
    onChange(mode);
  };

  return (
    <div className="flex justify-center gap-3 flex-wrap py-6">

      {[
        { id: "social", label: "Social Layer" },
        { id: "economy", label: "Economic Layer" },
        { id: "civic", label: "Civic Layer" },
        { id: "investor", label: "Investor View" },
      ].map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id as Mode)}
          className={`px-5 py-2 rounded-full text-sm border transition
            ${
              active === m.id
                ? "bg-white text-black"
                : "border-white/10 text-zinc-400 hover:bg-white/10"
            }`}
        >
          {m.label}
        </button>
      ))}

    </div>
  );
}
