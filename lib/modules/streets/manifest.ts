// @ts-nocheck
import { AppManifest } from "@/lib/mtaa/appstore/apps/types";

export const manifest: AppManifest = {
  id: "streets",
  name: "Streets",
  description: "App module",
  version: "1.0.0",
  icon: "Map",
  category: "navigation",
  permissions: ["location:read", "location:background", "storage:read"] as const,
  entry: "/streets",
  isOSApp: false,
  size: "18MB",
};
