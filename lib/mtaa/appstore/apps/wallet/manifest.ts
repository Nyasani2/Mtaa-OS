// @ts-nocheck
import { AppManifest } from "../types";

export const manifest: AppManifest = {
  id: "wallet",
  name: "Wallet",
  description: "App",
  version: "1.0.0",
  icon: "Wallet",
  category: "finance",
  color: "#10b981",
  osLevel: true,
  permissions: ["wallet:read", "wallet:write", "payments:read", "payments:write"] as const,
  entry: "/wallet",
  isOSApp: true,
  size: "8MB",
};
