// lib/shop/shopRegistry.ts
// MTAA AFRIQ Shop Module Registry Entry

export const SHOP_APP = {
  id: "shop",
  name: "SHOP OS",
  version: "1.0.0",
  category: "business",
  description: "Complete business operating system with POS, inventory, accounting, affiliate marketing, and escrow-connected marketplace fulfillment.",
  icon: "store",
  color: "#f59e0b",
  route: "/shop",
  installable: true,
  isSystem: false,
  permissions: [
    "supabase.read",
    "supabase.write",
    "realtime.orders",
    "camera.scan",
    "wallet.read",
    "escrow.access",
    "maps.location",
  ],
  modules: ["pos", "inventory", "accounting", "affiliate", "marketplace", "orders"],
  status: "stable",
  features: [
    "barcode_scanning",
    "qr_scanning",
    "pos_terminal",
    "inventory_tracking",
    "purchase_orders",
    "order_management",
    "escrow_payments",
    "delivery_tracking",
    "affiliate_programs",
    "commission_tracking",
    "profit_loss_reports",
    "balance_sheet",
    "cash_flow",
    "expense_tracking",
    "marketplace_sync",
    "customer_chat",
    "realtime_notifications",
  ],
};

// Register with kernel
import { registerApp } from "@/lib/kernel/registry";
registerApp(SHOP_APP);
