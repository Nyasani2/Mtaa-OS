export interface ManifestValidation {
  valid: boolean;
  errors: string[];
}

export interface InstallProgress {
  appId: string;
  progress: number;
  status: string;
}
