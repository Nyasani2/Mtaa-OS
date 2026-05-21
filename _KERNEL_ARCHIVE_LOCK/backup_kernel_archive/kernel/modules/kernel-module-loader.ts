import {
  kernelRegistry
} from "../registry/kernel-app-registry";

import {
  KernelAppManifest
} from "../apps/kernel-app-manifest";

class KernelModuleLoader {

  load(manifest: KernelAppManifest) {

    kernelRegistry.register({
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      permissions: manifest.permissions,
      routes: manifest.routes
    });

    console.log(
      "[KERNEL MODULE LOADED]",
      manifest.name
    );

    return true;
  }
}

export const kernelModuleLoader =
  new KernelModuleLoader();
