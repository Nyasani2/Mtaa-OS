import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "recents",
  name: "Recents",
  version: "1.0.0",
  description: "recents module",
  category: "utility",
  icon: "app",
  route: "/recents",
  permissions: ["recents:read"],
  status: "active",
};

export default manifest;
