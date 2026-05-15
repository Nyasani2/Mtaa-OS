export interface InstalledAppV2 {
  id: string;
  name: string;
  icon: string;
  route: string;
  color: string;
  category: string;
  version: string;
  description: string;
  installedAt: string;
}

export const AppRegistry = [];

export type AppItem = InstalledAppV2;
