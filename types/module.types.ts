// ============================================
// MTAA Module System Types
// ============================================

export type AppPermission = string;

export type AppCategory = 
  | "transport" 
  | "commerce" 
  | "social" 
  | "productivity"
  | "finance"
  | "government"
  | "health"
  | "education"
  | "entertainment"
  | "utility";

export type AppStatus = "active" | "beta" | "maintenance" | "deprecated";

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  category: AppCategory;
  icon: string;
  route: string;
  permissions: string[];
  status: AppStatus;
  isOSApp?: boolean;
  requiresAuth?: boolean;
  config?: Record<string, any>;
}

export interface ModuleConfig {
  manifest: AppManifest;
  routes?: Record<string, any>;
  services?: Record<string, any>;
}

export type ModuleID = string;
