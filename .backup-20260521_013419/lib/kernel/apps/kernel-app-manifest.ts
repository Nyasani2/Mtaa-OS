export type KernelAppManifest = {
  id: string;
  name: string;
  version: string;

  routes: string[];

  permissions: string[];

  dependencies?: string[];

  auto_boot?: boolean;

  sandboxed?: boolean;

  realtime?: boolean;

  background_worker?: boolean;
};
