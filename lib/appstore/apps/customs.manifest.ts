import { AppManifest } from '../types';

const manifest: AppManifest = {
  id: "customs",
  name: "Customs",
  version: "1.0.0",
  description: "customs module",
  category: "government",
  icon: "shield",
  route: "/civic/customs",
  permissions: ["customs:read"],
  status: "active",
};

export default manifest;
