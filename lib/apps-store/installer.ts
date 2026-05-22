export function useAppStoreInstaller() {
  return {
    install: async (appId: string) => ({ success: true }),
    uninstall: async (appId: string) => ({ success: true }),
    isInstalling: false,
    progress: 0,
  };
}

export interface ManifestValidation {
  valid: boolean;
  errors: string[];
}

export interface InstallProgress {
  appId: string;
  progress: number;
  status: string;
}
