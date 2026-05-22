export interface Shop {
  id: string;
  name: string;
  owner_id: string;
  location?: string;
  description?: string;
  logo_url?: string;
  created_at: string;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category?: string;
  barcode?: string;
  images?: string[];
  is_listed?: boolean;
  created_at: string;
}

export interface ShopOrder {
  id: string;
  shop_id: string;
  customer_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address?: string;
  affiliate_id?: string;
  delivered_at?: string;
  created_at: string;
}

export interface ShopCategory {
  id: string;
  name: string;
  shop_id: string;
}

export interface CartItem {
  product_id: string;
  shop_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface DashboardStats {
  revenue: number;
  orders: number;
  products: number;
  customers: number;
}

export interface ShopAccount {
  id: string;
  shop_id: string;
  name: string;
  account_type: string;
  balance: number;
  created_at: string;
}

export interface ShopExpense {
  id: string;
  shop_id: string;
  category: string;
  description?: string;
  amount: number;
  expense_date: string;
  created_at: string;
}

export interface AffiliateProgram {
  id: string;
  shop_id: string;
  commission_rate: number;
  min_payout_amount: number;
  payout_method: string;
  created_at: string;
}

export interface ShopAffiliate {
  id: string;
  shop_id: string;
  affiliate_id: string;
  balance: number;
  created_at: string;
}

export interface POSSession {
  id: string;
  shop_id: string;
  cashier_id: string;
  status: 'active' | 'closed';
  opened_at: string;
  closed_at?: string;
}
