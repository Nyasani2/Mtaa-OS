export interface Shop {
  id: string;
  name: string;
  owner_id: string;
  status: "active" | "inactive";
  [key: string]: any;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  status: "active" | "inactive";
  [key: string]: any;
}

export interface ShopOrder {
  id: string;
  shop_id: string;
  customer_id: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  items?: any[];
  [key: string]: any;
}

export interface ShopCategory {
  id: string;
  name: string;
  shop_id: string;
  [key: string]: any;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
  [key: string]: any;
}

export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  total_products: number;
  [key: string]: any;
}

export interface ShopAccount {
  id: string;
  shop_id: string;
  type: "asset" | "liability" | "equity";
  current_balance: number;
  [key: string]: any;
}

export interface ShopExpense {
  id: string;
  shop_id: string;
  amount: number;
  category: string;
  [key: string]: any;
}

export interface ShopJournalEntry {
  id: string;
  shop_id: string;
  debit: number;
  credit: number;
  [key: string]: any;
}

export interface AffiliateProgram {
  id: string;
  shop_id: string;
  commission_rate: number;
  status: "active" | "inactive";
  [key: string]: any;
}

export interface ShopAffiliate {
  id: string;
  shop_id: string;
  affiliate_id: string;
  status: "active" | "inactive";
  [key: string]: any;
}

export interface MarketplaceListing {
  id: string;
  shop_id: string;
  product_id: string;
  title: string;
  price: number;
  status: "active" | "sold" | "inactive";
  [key: string]: any;
}
