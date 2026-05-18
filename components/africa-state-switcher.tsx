"use client";

import { useState } from "react";

const countries = [
  "Kenya",
  "Nigeria",
  "South Africa",
  "Ghana",
  "Ethiopia",
  "Rwanda",
];

export default function AfricaStateSwitcher({
  onChange,
}: {
  onChange: (country: string) => void;
}) {
  const [active, setActive] = useState("Kenya");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

      <h2 className="text-sm text-zinc-400 mb-4">
        Africa State Layer
      </h2>

      <div className="flex flex-wrap gap-2">
        {countries.map((c) => (
          <button
            key={c}
            onClick={() => {
              setActive(c);
              onChange(c);
            }}
            className={`px-3 py-2 rounded-full text-sm border transition
              ${active === c
                ? "bg-white text-black"
                : "border-white/10 text-zinc-400"
              }`}
          >
            {c}
          </button>
        ))}
      </div>

    </div>
  );
}
