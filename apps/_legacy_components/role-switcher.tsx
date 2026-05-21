"use client";

import { useState } from "react";

export type Role = "citizen" | "governor" | "president" | "investor";

type Props = {
  onChange?: (role: Role) => void;
};

export default function RoleSwitcher({ onChange }: Props) {
  const [active, setActive] = useState<Role>("citizen");

  const roles: { id: Role; label: string }[] = [
    { id: "citizen", label: "Citizen View" },
    { id: "governor", label: "Governor View" },
    { id: "president", label: "President Command" },
    { id: "investor", label: "Investor Lens" },
  ];

  const setRole = (role: Role) => {
    setActive(role);
    if (onChange) onChange(role);
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center py-6">
      {roles.map((r) => (
        <button
          key={r.id}
          onClick={() => setRole(r.id)}
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
