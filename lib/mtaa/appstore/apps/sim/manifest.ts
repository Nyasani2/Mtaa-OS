// @ts-nocheck
import { AppManifest } from "../types";

export const manifest: AppManifest = {
  id: "sim",
  name: "Sim",
  description: "App",
  version: "1.0.0",
  icon: "SimCard",
  category: "system",
  color: "#f97316",
  permissions: ["phone", "sms"] as const,
  entry: "/sim",
  isOSApp: true,
  size: "4MB",
};
