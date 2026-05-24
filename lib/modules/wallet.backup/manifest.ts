import { AppManifest } from "@/lib/mtaa/appstore/apps/types";

export const manifest: AppManifest = {
  id: "wallet",
  name: "Wallet",
  description: "App module",
  version: "1.0.0",
  icon: "Wallet",
  category: "finance",
  osLevel: true,
permissions: ["wallet:read", "wallet:write", "payments:read", "payments:write"] as const,
  entry: "/wallet",
  isOSApp: true,
  size: "8MB",
};
