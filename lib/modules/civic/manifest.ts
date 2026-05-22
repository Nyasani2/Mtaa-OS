import { AppManifest } from "@/lib/mtaa/appstore/apps/types";

export const manifest: AppManifest = {
  id: "civic",
  name: "Civic",
  description: "App module",
  version: "1.0.0",
  icon: "Landmark",
  category: "government",
  permissions: ["civic:read", "civic:write", "civic:admin"] as const,
  entry: "/civic",
  isOSApp: false,
  size: "15MB",
};
