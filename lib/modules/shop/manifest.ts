import { AppManifest } from "@/lib/mtaa/appstore/apps/types";

export const manifest: AppManifest = {
  id: "shop",
  name: "Shop",
  description: "App module",
  version: "1.0.0",
  icon: "ShoppingBag",
  category: "commerce",
  permissions: ["storage:read", "storage:write", "payments:read", "payments:write"] as const,
  entry: "/shop",
  isOSApp: false,
  size: "12MB",
};
