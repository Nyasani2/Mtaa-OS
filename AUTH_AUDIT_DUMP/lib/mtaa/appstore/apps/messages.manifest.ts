import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "messages",
  name: "Messages",
  version: "1.0.0",
  description: "messages module",
  category: "utility",
  icon: "app",
  route: "/messages",
  permissions: ["messages:read"],
  status: "active",
};

export default manifest;
