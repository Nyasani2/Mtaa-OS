export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  icon: string;
  route: string;
  permissions: string[];
  status: string;
  isOSApp?: boolean;
  requiresAuth?: boolean;
}
