export function useLauncherData() {
  return {
    sections: [],
    isLoading: false,
  };
}

export interface LauncherSection {
  id: string;
  title: string;
  apps: any[];
}
