"use client";

import { useState } from "react";

type Role = "citizen" | "governor" | "president" | "investor";

export default function RoleSwitcher({
  onChange,
}: {
  onChange?: (role: Role) => void;
}) {
  const [active, setActive] = useState<Role>("citizen");

  const setRole = (r: Role) => {
    setActive(r);
    onChange?.(r);
  };

  const roles = [
    { id: "citizen", label: "Citizen View" },
    { id: "governor", label: "Governor View" },
    { id: "president", label: "President Command" },
    { id: "investor", label: "Investor Lens" },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center py-6">
      {roles.map((r) => (
        <button
          key={r.id}
          onClick={() => setRole(r.id as Role)}
          className={`px-5 py-2 rounded-full text-sm border transition ${
            active === r.id
              ? "bg-white text-black"
              : "border-white/10 text-zinc-400 hover:bg-white/10"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
