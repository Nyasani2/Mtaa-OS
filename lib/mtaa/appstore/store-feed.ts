import { listApps } from "./registry";
import type { AppManifest } from "./apps/types";

export function getStoreFeed() {
  const apps = listApps();
  return {
    featured: apps.slice(0, 5),
    categories: Array.from(new Set(apps.map((app: AppManifest) => app.category))),
    trending: apps.slice(0, 10),
  };
}
