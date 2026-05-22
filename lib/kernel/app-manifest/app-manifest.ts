export interface AppResource {
  resource: string;
  actions: string[];
  description?: string;
}

export interface AppManifest {
  id: string;
  name: string;
  resources: AppResource[];
  permissions: string[];
}
