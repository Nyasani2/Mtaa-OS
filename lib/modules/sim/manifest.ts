import { AppManifest } from "@/lib/mtaa/appstore/apps/types";

export const manifest: AppManifest = {
  id: "sim",
  name: "Sim",
  description: "App module",
  version: "1.0.0",
  icon: "SimCard",
  category: "system",
  permissions: ["phone:read", "phone:write", "contacts:read"] as const,
  entry: "/sim",
  isOSApp: true,
  size: "4MB",
};
