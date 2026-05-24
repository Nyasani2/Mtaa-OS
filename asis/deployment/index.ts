// asis/deployment/index.ts
// Barrel export for ASIS Deployment + System Integration Core

export { packageSystem, ASIS_PACKAGE } from './asis-package';
export { buildSystem, BuildMode, BuildOptions, BuildArtifact } from './build-system';
export { installManager, InstallPhase, InstallState } from './install-manager';
export { systemLoader, BootMode, BootContext } from './system-loader';
export { environmentConfig, EnvironmentConfig } from './environment-config';
export { versionManager, VersionInfo, Migration } from './version-manager';
export { moduleLinker, ModuleLink } from './module-linker';
export { apiGateway, APIRequest, APIResponse } from './api-gateway';
export { integrationLayer, MTAAAppBridge } from './integration-layer';
export { startupSequence, StartupStep, StartupEvent } from './startup-sequence';

// Adapters
export { mtaaAdapter } from './adapters/mtaa-adapter';
export { mobileAdapter } from './adapters/mobile-adapter';
export { webAdapter } from './adapters/web-adapter';
export { nativeAdapter } from './adapters/native-adapter';

// Hooks
export { preInstall } from './hooks/pre-install';
export { postInstall } from './hooks/post-install';
export { preUpdate } from './hooks/pre-update';
export { postUpdate } from './hooks/post-update';
export { executeRollback } from './hooks/rollback';

// Environment configs
export { devConfig } from './environments/dev.config';
export { stagingConfig } from './environments/staging.config';
export { prodConfig } from './environments/prod.config';

// Types
export * from './types';
export * from './interfaces';
