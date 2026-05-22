import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "border",
  name: "Border",
  version: "1.0.0",
  description: "border module",
  category: "government",
  icon: "shield",
  route: "/civic/border",
  permissions: ["border:read"],
  status: "active",
};

export default manifest;
