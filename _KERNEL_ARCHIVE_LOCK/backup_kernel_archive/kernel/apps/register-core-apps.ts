import {
  kernelModuleLoader
} from "../modules/kernel-module-loader";

kernelModuleLoader.load({
  id: "wallet",
  name: "MTAA Wallet",
  version: "1.0.0",
  permissions: [
    "payments",
    "qr",
    "transactions"
  ],
  routes: [
    "/(wallet)"
  ],
  realtime: true
});

kernelModuleLoader.load({
  id: "hookup",
  name: "Hookup OS",
  version: "1.0.0",
  permissions: [
    "voice",
    "video",
    "rooms"
  ],
  routes: [
    "/(hookup)"
  ],
  realtime: true
});

kernelModuleLoader.load({
  id: "mtruck",
  name: "MTruck",
  version: "1.0.0",
  permissions: [
    "tracking",
    "dispatch",
    "fleet"
  ],
  routes: [
    "/(mtruck)"
  ],
  realtime: true
});

kernelModuleLoader.load({
  id: "civic",
  name: "Civic",
  version: "1.0.0",
  permissions: [
    "identity",
    "tax",
    "audit"
  ],
  routes: [
    "/(civic)"
  ]
});
