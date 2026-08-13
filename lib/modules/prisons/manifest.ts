// @ts-nocheck
import { AppManifest } from "@/lib/mtaa/appstore/apps/types";

export const manifest: AppManifest = {
  id: "prisons",
  name: "Prisons",
  description: "App module",
  version: "1.0.0",
  icon: "Building2",
  category: "government",
  permissions: ["prisons:read", "prisons:write", "prisons:admin"] as const,
  entry: "/prisons",
  isOSApp: false,
  size: "14MB",
};
