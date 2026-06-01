import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "sim",
  name: "Sim",
  version: "1.0.0",
  description: "sim module",
  category: "utility",
  icon: "app",
  route: "/sim",
  permissions: ["sim:read"],
  status: "active",
};

export default manifest;
