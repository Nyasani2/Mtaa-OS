"use client";

import AfricaStateSwitcher from "@/components/africa-state-switcher";

export default function ClientAfricaWrapper() {
  return (
    <AfricaStateSwitcher onChange={(c) => console.log("country:", c)} />
  );
}
