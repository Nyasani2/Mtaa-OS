import { AppManifest } from "@/lib/apps-store/types";

export const manifest: AppManifest = {
  id: "wallet",
  name: "Wallet",
  description: "MTAA Wallet with Go Fund credit line",
  version: "2.0.0",
  icon: "Wallet",
  category: "finance",
  osLevel: true,
  permissions: [
    "wallet:read",
    "wallet:write",
    "payments:read",
    "payments:write",
    "credit:read",
    "credit:write",
  ],
  entry: "/wallet",
  isOSApp: true,
  size: "12MB",
};

export default manifest;
