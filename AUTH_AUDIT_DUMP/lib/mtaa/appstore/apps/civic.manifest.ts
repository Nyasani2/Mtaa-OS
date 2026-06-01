import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "civic",
  name: "Civic",
  version: "1.0.0",
  description: "civic module",
  category: "utility",
  icon: "app",
  route: "/civic",
  permissions: ["civic:read"],
  status: "active",
};

export default manifest;
