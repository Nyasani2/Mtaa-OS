import { AppManifest } from "../types";

export const manifest: AppManifest = {
  id: "recents",
  name: "Recents",
  description: "App",
  version: "1.0.0",
  icon: "History",
  category: "system",
  color: "#64748b",
  author: "MTAA OS",
  permissions: ["recents:read", "recents:write"] as const,
  entry: "/recents",
  isOSApp: true,
  size: "2MB",
};
