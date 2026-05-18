"use client";

import RoleSwitcher from "@/components/role-switcher";

export default function ClientRoleWrapper() {
  return (
    <RoleSwitcher onChange={(r) => console.log("role:", r)} />
  );
}
