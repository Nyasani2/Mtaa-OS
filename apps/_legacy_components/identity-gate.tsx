"use client";

import { useState } from "react";

type Role = "citizen" | "officer" | "governor" | "president";

export default function IdentityGate({
  onRoleChange,
}: {
  onRoleChange: (r: Role) => void;
}) {
  const [role, setRole] = useState<Role>("citizen");

  const changeRole = (r: Role) => {
    setRole(r);
    onRoleChange(r);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

      <h2 className="text-sm text-zinc-400 mb-4">
        Identity Access Layer
      </h2>

      <div className="flex flex-wrap gap-3">
        {["citizen", "officer", "governor", "president"].map((r) => (
          <button
            key={r}
            onClick={() => changeRole(r as Role)}
            className={`px-4 py-2 rounded-full text-sm border transition
              ${role === r ? "bg-white text-black" : "border-white/10 text-zinc-400"}`}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      <p className="text-xs text-zinc-500 mt-4">
        Current access level: {role}
      </p>

    </div>
  );
}
