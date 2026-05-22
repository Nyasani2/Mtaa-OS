import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "immigration",
  name: "Immigration",
  version: "1.0.0",
  description: "immigration module",
  category: "government",
  icon: "shield",
  route: "/civic/immigration",
  permissions: ["immigration:read"],
  status: "active",
};

export default manifest;
