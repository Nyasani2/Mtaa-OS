import { manifest as walletManifest } from "./apps/wallet/manifest";
import { manifest as civicManifest } from "./apps/civic/manifest";
import { manifest as clockManifest } from "./apps/clock/manifest";
import { manifest as documentsManifest } from "./apps/documents/manifest";
import { manifest as galleryManifest } from "./apps/gallery/manifest";
import { manifest as messagesManifest } from "./apps/messages/manifest";
import { manifest as recentsManifest } from "./apps/recents/manifest";
import { manifest as schedulerManifest } from "./apps/scheduler/manifest";
import { manifest as simManifest } from "./apps/sim/manifest";
import type { AppManifest } from "./apps/types";

const REGISTRY = new Map<string, AppManifest>([
  ["wallet", walletManifest],
  ["civic", civicManifest],
  ["clock", clockManifest],
  ["documents", documentsManifest],
  ["gallery", galleryManifest],
  ["messages", messagesManifest],
  ["recents", recentsManifest],
  ["scheduler", schedulerManifest],
  ["sim", simManifest],
]);

export function getAppById(id: string): AppManifest | undefined {
  return REGISTRY.get(id);
}

export function isSystemApp(id: string): boolean {
  const app = REGISTRY.get(id);
  return app?.isOSApp || false;
}

export function isLocalApp(id: string): boolean {
  const app = REGISTRY.get(id);
  return !app?.isOSApp;
}

export function listApps(): AppManifest[] {
  return Array.from(REGISTRY.values());
}

export const BUILTIN_APPS = listApps();
export const WALLET_APP = walletManifest;
