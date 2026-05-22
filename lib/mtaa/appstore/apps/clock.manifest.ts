import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "clock",
  name: "Clock",
  version: "1.0.0",
  description: "clock module",
  category: "utility",
  icon: "app",
  route: "/clock",
  permissions: ["clock:read"],
  status: "active",
};

export default manifest;
