// lib/shop/types.ts
// MTAA AFRIQ Shop Module - Type Definitions

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  sub_categories: string[];
  logo_url?: string;
  banner_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  registration_number?: string;
  tax_number?: string;
  business_type?: string;
  operating_hours: Record<string, { open: string; close: string; closed: boolean }>;
  settings: ShopSettings;
  status: "pending" | "active" | "suspended" | "closed";
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  rating: number;
  review_count: number;
  total_sales: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export interface ShopSettings {
  currency: string;
  tax_rate: number;
  allow_pickup: boolean;
  allow_delivery: boolean;
  delivery_radius_km: number;
  min_order_amount: number;
  pos_enabled: boolean;
  affiliate_enabled: boolean;
  escrow_enabled: boolean;
  auto_accept_orders: boolean;
}

export interface ShopStaff {
  id: string;
  shop_id: string;
  user_id?: string;
  email?: string;
  name: string;
  role: "owner" | "manager" | "cashier" | "inventory_manager" | "delivery_agent";
  permissions: string[];
  pin_code?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface ShopCategory {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  category_id?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  qr_code?: string;
  base_price: number;
  sale_price?: number;
  cost_price?: number;
  tax_inclusive: boolean;
  stock_quantity: number;
  stock_alert_level: number;
  track_inventory: boolean;
  allow_backorders: boolean;
  variants: ProductVariant[];
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  is_digital: boolean;
  view_count: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
  price_adjustment: number;
  sku?: string;
  barcode?: string;
  stock_quantity: number;
}

export interface InventoryTransaction {
  id: string;
  shop_id: string;
  product_id: string;
  type: "purchase" | "sale" | "return" | "adjustment" | "transfer_in" | "transfer_out" | "damage" | "expired";
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  performed_by?: string;
  created_at: string;
}

export interface POSSession {
  id: string;
  shop_id: string;
  staff_id: string;
  opened_at: string;
  closed_at?: string;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  cash_difference?: number;
  total_sales: number;
  total_transactions: number;
  total_refunds: number;
  status: "open" | "closed" | "verified";
  notes?: string;
}

export interface ShopOrder {
  id: string;
  shop_id: string;
  customer_id?: string;
  order_number: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled" | "refunded";
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_notes?: string;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_status: "pending" | "paid" | "partial" | "refunded" | "failed";
  payment_method?: string;
  escrow_enabled: boolean;
  escrow_account_id?: string;
  escrow_released_at?: string;
  affiliate_id?: string;
  affiliate_commission: number;
  delivery_type: "pickup" | "delivery" | "shipping";
  delivery_agent_id?: string;
  delivered_at?: string;
  delivery_receipt_scanned: boolean;
  delivery_receipt_url?: string;
  pos_session_id?: string;
  is_pos_order: boolean;
  created_at: string;
  updated_at: string;
  items?: ShopOrderItem[];
}

export interface ShopOrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant_data: Record<string, any>;
}

export interface ShopAccount {
  id: string;
  shop_id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  sub_type?: string;
  parent_id?: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
}

export interface ShopExpense {
  id: string;
  shop_id: string;
  category: string;
  description?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  receipt_url?: string;
  paid_by: string;
  expense_date: string;
  created_by?: string;
}


export interface ShopAffiliate {
  id: string;
  shop_id: string;
  user_id: string;
  referral_code: string;
  referral_link?: string;
  status: "pending" | "active" | "suspended" | "banned";
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  total_paid: number;
  balance: number;
}

export interface MarketplaceListing {
  id: string;
  shop_id: string;
  product_id: string;
  marketplace_price?: number;
  marketplace_description?: string;
  marketplace_images: string[];
  is_featured: boolean;
  is_promoted: boolean;
  priority_score: number;
  marketplace_views: number;
  marketplace_sales: number;
  status: "active" | "paused" | "sold_out" | "removed";
  product?: ShopProduct;
  shop?: Shop;
}

export interface ShopMessage {
  id: string;
  shop_id: string;
  customer_id: string;
  sender_type: "customer" | "shop" | "system";
  message: string;
  product_id?: string;
  order_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface ShopReview {
  id: string;
  shop_id: string;
  customer_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  shop_response?: string;
  shop_responded_at?: string;
  is_verified_purchase: boolean;
  is_visible: boolean;
  helpful_count: number;
}

export interface CartItem {
  product: ShopProduct;
  quantity: number;
  variant?: ProductVariant;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  low_stock_items: number;
  today_sales: number;
  today_orders: number;
}
