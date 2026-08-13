// @ts-nocheck
import { AppManifest } from "@/lib/mtaa/appstore/apps/types";

export const manifest: AppManifest = {
  id: "tribes",
  name: "Tribes",
  description: "App module",
  version: "1.0.0",
  icon: "Users",
  category: "social",
  permissions: ["contacts:read", "messaging:send", "storage:read"] as const,
  entry: "/tribes",
  isOSApp: false,
  size: "10MB",
};
