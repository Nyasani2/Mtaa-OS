import { AppManifest } from "../types";

export const manifest: AppManifest = {
  id: "civic",
  name: "Civic",
  description: "App",
  version: "1.0.0",
  icon: "Landmark",
  category: "government",
  color: "#2563eb",
  permissions: ["location", "camera", "storage", "notifications"] as const,
  entry: "/civic",
  isOSApp: false,
  size: "15MB",
};
