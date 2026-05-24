// asis/deployment/interfaces.ts
// Public interfaces for external consumption

export interface IASISPackage {
  version: string;
  getModules(): string[];
  validate(): boolean;
}

export interface IBuildSystem {
  build(options: any): Promise<any>;
  getStatus(): any;
}

export interface IInstallManager {
  install(pkg: any): Promise<{ success: boolean }>;
  rollback(): Promise<boolean>;
  getState(): any;
}

export interface IAPIGateway {
  handle(req: any): Promise<any>;
  activate(): Promise<void>;
}

export interface ISystemLoader {
  initialize(pkg: any): Promise<any>;
  registerModule(mod: any): Promise<void>;
  getStatus(): any;
}

export interface IIntegrationLayer {
  sendToApp(app: string, event: string, payload: any): Promise<boolean>;
  registerBridge(bridge: any): () => void;
}
