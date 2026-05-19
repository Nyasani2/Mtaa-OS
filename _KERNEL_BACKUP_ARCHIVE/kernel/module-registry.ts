export type MTAModule = {
  id: string;
  name: string;
  route: string;
  icon: string;
  description: string;
  category: "core" | "finance" | "social" | "gov" | "logistics" | "admin";
  enabled: boolean;
};

export const MODULE_REGISTRY: MTAModule[] = [
  {
    id: "launcher",
    name: "OS Home",
    route: "/(os)/launcher",
    icon: "🧠",
    description: "MTAA System Launcher",
    category: "core",
    enabled: true,
  },
  {
    id: "command",
    name: "Command Centre",
    route: "/(command)",
    icon: "🛰️",
    description: "System Control & Governance",
    category: "gov",
    enabled: true,
  },
  {
    id: "wallet",
    name: "Wallet",
    route: "/(wallet)/dashboard",
    icon: "💰",
    description: "Financial OS Layer",
    category: "finance",
    enabled: true,
  },
  {
    id: "hookup",
    name: "Hookup",
    route: "/(hookup)",
    icon: "❤️",
    description: "Social Graph Engine",
    category: "social",
    enabled: true,
  },
  {
    id: "tribes",
    name: "Tribes",
    route: "/(tribes)",
    icon: "🏺",
    description: "Cultural Memory System",
    category: "social",
    enabled: true,
  },
  {
    id: "mtruck",
    name: "MTruck",
    route: "/(mtruck)",
    icon: "🚛",
    description: "Logistics & Fleet OS",
    category: "logistics",
    enabled: true,
  },
  {
    id: "admin",
    name: "Admin",
    route: "/(hookup-admin)/analytics",
    icon: "🧾",
    description: "System Governance Layer",
    category: "admin",
    enabled: true,
  },
];

export function getModuleById(id: string) {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

export function getEnabledModules() {
  return MODULE_REGISTRY.filter((m) => m.enabled);
}
