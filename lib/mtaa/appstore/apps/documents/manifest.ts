import { AppManifest } from "../types";

export const manifest: AppManifest = {
  id: "documents",
  name: "Documents",
  description: "App",
  version: "1.0.0",
  icon: "FileText",
  category: "system",
  color: "#3b82f6",
  permissions: ["storage", "camera", "files"] as const,
  entry: "/documents",
  isOSApp: true,
  size: "5MB",
};
