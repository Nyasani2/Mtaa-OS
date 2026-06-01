import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "scheduler",
  name: "Scheduler",
  version: "1.0.0",
  description: "scheduler module",
  category: "utility",
  icon: "app",
  route: "/scheduler",
  permissions: ["scheduler:read"],
  status: "active",
};

export default manifest;
