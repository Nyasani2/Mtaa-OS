export type AppPermission =
  | "storage:read" | "storage:write"
  | "payments:read" | "payments:write"
  | "location:read" | "location:background"
  | "contacts:read" | "contacts:write"
  | "messaging:send" | "messaging:read"
  | "camera:read" | "microphone:read"
  | "phone:read" | "phone:write"
  | "health:read" | "health:write"
  | "wallet:read" | "wallet:write"
  | "notifications:send" | "notifications:read"
  | "analytics:read" | "analytics:admin"
  | "ads:read" | "ads:write" | "ads:admin" | "ads:campaign"
  | "binance:read" | "binance:write" | "binance:trade"
  | "civic:read" | "civic:write" | "civic:admin"
  | "clock:read" | "clock:write"
  | "courts:read" | "courts:write" | "courts:admin"
  | "credit:read" | "credit:write" | "credit:admin" | "credit:approve"
  | "documents:read" | "documents:write" | "documents:admin"
  | "education:read" | "education:write" | "education:admin" | "education:instruct"
  | "gallery:read" | "gallery:write" | "gallery:admin"
  | "hookup:read" | "hookup:write" | "hookup:admin"
  | "jobs:read" | "jobs:write" | "jobs:admin" | "jobs:recruit"
  | "marketplace:read" | "marketplace:write" | "marketplace:admin"
  | "messages:read" | "messages:write" | "messages:admin"
  | "mtaxi:read" | "mtaxi:write" | "mtaxi:admin" | "mtaxi:drive"
  | "mtruck:read" | "mtruck:write" | "mtruck:admin" | "mtruck:dispatch"
  | "police:read" | "police:write" | "police:admin"
  | "prisons:read" | "prisons:write" | "prisons:admin"
  | "recents:read" | "recents:write"
  | "revenue:read" | "revenue:write" | "revenue:admin" | "revenue:file"
  | "scheduler:read" | "scheduler:write" | "scheduler:admin"
  | "settings:read" | "settings:write" | "settings:admin"
  | "streets:read" | "streets:write" | "streets:admin"
  | "tribes:read" | "tribes:write" | "tribes:admin"
  | "shop:read" | "shop:write" | "shop:admin"
  | "location" | "camera" | "storage" | "notifications"
  | "contacts" | "phone" | "sms" | "microphone" | "files";

export interface AppManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  category: string;
  color?: string;
  author?: string;
  osLevel?: boolean;
  permissions: AppPermission[];
  entry: string;
  isOSApp: boolean;
  size: string;
}

export interface InstalledApp {
  manifest: AppManifest;
  installDate: string;
  isActive: boolean;
}

export interface ModuleManifest extends AppManifest {
  color: string;
  apps?: ModuleManifest[];
}
