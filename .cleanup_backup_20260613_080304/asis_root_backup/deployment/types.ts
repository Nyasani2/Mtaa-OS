// asis/deployment/types.ts
// Core deployment types

export interface ASISModule {
  name: string;
  version: string;
  entryPoint: string;
  exports: string[];
}

export interface PackageManifest {
  name: string;
  version: string;
  modules: ASISModule[];
  checksum: string;
  builtAt: number;
}

export interface ModuleGraph {
  [module: string]: string[];
}

export interface SecurityProfile {
  level: 'strict' | 'moderate' | 'relaxed';
  encryption: boolean;
  auditLog: boolean;
  sandbox: boolean;
}

export interface BuildConfig {
  mode: 'incremental' | 'clean';
  environment: 'dev' | 'staging' | 'prod';
  optimize: boolean;
}

export interface DeploymentStatus {
  phase: string;
  progress: number;
  errors: string[];
  canRollback: boolean;
}
