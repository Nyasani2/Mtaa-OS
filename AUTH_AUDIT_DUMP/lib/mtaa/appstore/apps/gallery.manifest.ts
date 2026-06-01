import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "gallery",
  name: "Gallery",
  version: "1.0.0",
  description: "gallery module",
  category: "utility",
  icon: "app",
  route: "/gallery",
  permissions: ["gallery:read"],
  status: "active",
};

export default manifest;
