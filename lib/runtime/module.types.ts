export interface ModuleManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  icon: string;
  color: string;
  entryRoute: string;
  routes: string[];
  permissions: string[];
  dependencies: string[];
  isOSCore: boolean;
  installable: boolean;
  minOSVersion: string;
}
