// @ts-nocheck
import { AppManifest } from "@/lib/mtaa/appstore/apps/types";

export const manifest: AppManifest = {
  id: "courts",
  name: "Courts",
  description: "App module",
  version: "1.0.0",
  icon: "Scale",
  category: "government",
  permissions: ["courts:read", "courts:write", "courts:admin"] as const,
  entry: "/courts",
  isOSApp: false,
  size: "12MB",
};
