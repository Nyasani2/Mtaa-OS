import { AppManifest } from "../types";

export const manifest: AppManifest = {
  id: "messages",
  name: "Messages",
  description: "App",
  version: "1.0.0",
  icon: "MessageCircle",
  category: "communication",
  color: "#10b981",
  permissions: ["notifications", "storage", "contacts"] as const,
  entry: "/messages",
  isOSApp: true,
  size: "8MB",
};
