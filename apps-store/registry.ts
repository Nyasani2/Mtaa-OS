/**
 * MTAA OS - App Store Registry
 */

export type AppManifest = {
  name: string;
  entry: string;
  permissions: string[];
  mountPath: string;
};

export const appRegistry: Record<string, AppManifest> = {
  mtruck: {
    name: "MTAXI",
    entry: "apps-store/apps/mtruck/entry.ts",
    permissions: ["location", "network", "storage"],
    mountPath: "/apps/mtruck"
  },
  civic: {
    name: "Civic Health",
    entry: "domains/civic/entry.ts",
    permissions: ["database", "identity"],
    mountPath: "/domains/civic"
  }
};

export function getApp(name: string) {
  return appRegistry[name];
}
