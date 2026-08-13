// @ts-nocheck
import { AppManifest } from "../types";

export const manifest: AppManifest = {
  id: "scheduler",
  name: "Scheduler",
  description: "App",
  version: "1.0.0",
  icon: "Calendar",
  category: "system",
  color: "#8b5cf6",
  permissions: ["notifications", "storage", "contacts"] as const,
  entry: "/scheduler",
  isOSApp: true,
  size: "4MB",
};
