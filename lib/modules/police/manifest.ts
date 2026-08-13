// @ts-nocheck
import { AppManifest } from "@/lib/mtaa/appstore/apps/types";

export const manifest: AppManifest = {
  id: "police",
  name: "Police",
  description: "App module",
  version: "1.0.0",
  icon: "Shield",
  category: "government",
  permissions: ["police:read", "police:write", "police:admin"] as const,
  entry: "/police",
  isOSApp: false,
  size: "14MB",
};
