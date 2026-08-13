// @ts-nocheck
import { AppManifest } from "../types";

export const manifest: AppManifest = {
  id: "clock",
  name: "Clock",
  description: "App",
  version: "1.0.0",
  icon: "Clock",
  category: "system",
  color: "#f59e0b",
  permissions: ["notifications"] as const,
  entry: "/clock",
  isOSApp: true,
  size: "2MB",
};
