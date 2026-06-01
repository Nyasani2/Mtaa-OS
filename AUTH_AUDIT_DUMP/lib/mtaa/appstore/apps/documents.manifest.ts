import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "documents",
  name: "Documents",
  version: "1.0.0",
  description: "documents module",
  category: "utility",
  icon: "app",
  route: "/documents",
  permissions: ["documents:read"],
  status: "active",
};

export default manifest;
