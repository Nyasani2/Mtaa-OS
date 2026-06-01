import { AppManifest } from "../types";

export const manifest: AppManifest = {
  id: "gallery",
  name: "Gallery",
  description: "App",
  version: "1.0.0",
  icon: "Image",
  category: "system",
  color: "#ec4899",
  permissions: ["storage", "camera", "microphone"] as const,
  entry: "/gallery",
  isOSApp: true,
  size: "6MB",
};
