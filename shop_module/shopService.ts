// lib/shop/services/shopService.ts
import { supabase } from "@/lib/supabase/client";
import { Shop, ShopProduct, ShopOrder, ShopCategory, DashboardStats, CartItem } from "../types";

export class ShopService {
  // === SHOP CRUD ===
  static async createShop(data: Partial<Shop>): Promise<Shop> {
    const { data: shop, error } = await supabase.from("shops").insert(data).select().single();
    if (error) throw error;
    return shop;
  }

  static async getMyShops(): Promise<Shop[]> {
    const { data, error } = await supabase.from("shops").select("*").eq("owner_id", (await supabase.auth.getUser()).data.user?.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getShopById(id: string): Promise<Shop> {
    const { data, error } = await supabase.from("shops").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  }

  static async getShopBySlug(slug: string): Promise<Shop> {
    const { data, error } = await supabase.from("shops").select("*").eq("slug", slug).single();
    if (error) throw error;
    return data;
  }

  static async updateShop(id: string, updates: Partial<Shop>): Promise<Shop> {
    const { data, error } = await supabase.from("shops").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }

  static async getNearbyShops(lat: number, lng: number, radiusKm: number = 25, category?: string): Promise<Shop[]> {
    let query = supabase.rpc("get_nearby_shops", { lat, lng, radius_km: radiusKm });
    if (category) query = query.eq("category", category);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // === PRODUCTS ===
  static async getProducts(shopId: string, options?: { categoryId?: string; search?: string; activeOnly?: boolean }): Promise<ShopProduct[]> {
    let query = supabase.from("shop_products").select("*").eq("shop_id", shopId);
    if (options?.categoryId) query = query.eq("category_id", options.categoryId);
    if (options?.search) query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    if (options?.activeOnly) query = query.eq("is_active", true);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getProductById(id: string): Promise<ShopProduct> {
    const { data, error } = await supabase.from("shop_products").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  }

  static async getProductByBarcode(shopId: string, code: string, type: "barcode" | "qr" = "barcode"): Promise<{ found: boolean; product?: ShopProduct; in_stock?: boolean }> {
    const { data, error } = await supabase.functions.invoke("shop-pos-scan", {
      body: { shop_id: shopId, code, type },
    });
    if (error) throw error;
    return data;
  }

  static async createProduct(product: Partial<ShopProduct>): Promise<ShopProduct> {
    const { data, error } = await supabase.from("shop_products").insert(product).select().single();
    if (error) throw error;
    return data;
  }

  static async updateProduct(id: string, updates: Partial<ShopProduct>): Promise<ShopProduct> {
    const { data, error } = await supabase.from("shop_products").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from("shop_products").delete().eq("id", id);
    if (error) throw error;
  }

  // === CATEGORIES ===
  static async getCategories(shopId: string): Promise<ShopCategory[]> {
    const { data, error } = await supabase.from("shop_categories").select("*").eq("shop_id", shopId).order("sort_order");
    if (error) throw error;
    return data || [];
  }

  static async createCategory(category: Partial<ShopCategory>): Promise<ShopCategory> {
    const { data, error } = await supabase.from("shop_categories").insert(category).select().single();
    if (error) throw error;
    return data;
  }

  // === ORDERS ===
  static async getOrders(shopId: string, status?: string): Promise<ShopOrder[]> {
    let query = supabase.from("shop_orders").select("*, items:shop_order_items(*)").eq("shop_id", shopId);
    if (status) query = query.eq("status", status);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getOrderById(id: string): Promise<ShopOrder> {
    const { data, error } = await supabase.from("shop_orders").select("*, items:shop_order_items(*)").eq("id", id).single();
    if (error) throw error;
    return data;
  }

  static async getMyOrders(): Promise<ShopOrder[]> {
    const { data, error } = await supabase.from("shop_orders").select("*, items:shop_order_items(*), shop:shop_id(name, logo_url)").eq("customer_id", (await supabase.auth.getUser()).data.user?.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createOrder(orderData: any): Promise<ShopOrder> {
    const { data, error } = await supabase.functions.invoke("shop-create-order", { body: orderData });
    if (error) throw error;
    return data.order;
  }

  static async updateOrderStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase.from("shop_orders").update({ status }).eq("id", id);
    if (error) throw error;
  }

  static async confirmDelivery(orderId: string, receiptUrl?: string, agentId?: string): Promise<void> {
    const { error } = await supabase.functions.invoke("shop-escrow-release", {
      body: { order_id: orderId, receipt_url: receiptUrl, delivery_agent_id: agentId },
    });
    if (error) throw error;
  }

  // === POS SESSIONS ===
  static async openPosSession(shopId: string, staffId: string, openingCash: number): Promise<any> {
    const { data, error } = await supabase.from("pos_sessions").insert({
      shop_id: shopId,
      staff_id: staffId,
      opening_cash: openingCash,
    }).select().single();
    if (error) throw error;
    return data;
  }

  static async closePosSession(sessionId: string, closingCash: number, notes?: string): Promise<any> {
    const { data: session } = await supabase.from("pos_sessions").select("*").eq("id", sessionId).single();
    const expectedCash = session.opening_cash + session.total_sales - session.total_refunds;
    const { data, error } = await supabase.from("pos_sessions").update({
      closed_at: new Date().toISOString(),
      closing_cash: closingCash,
      expected_cash: expectedCash,
      cash_difference: closingCash - expectedCash,
      status: "closed",
      notes,
    }).eq("id", sessionId).select().single();
    if (error) throw error;
    return data;
  }

  static async getActivePosSession(shopId: string): Promise<any> {
    const { data, error } = await supabase.from("pos_sessions").select("*").eq("shop_id", shopId).eq("status", "open").order("opened_at", { ascending: false }).limit(1).single();
    if (error) return null;
    return data;
  }

  // === DASHBOARD ===
  static async getDashboardStats(shopId: string): Promise<DashboardStats> {
    const { data, error } = await supabase.rpc("get_shop_dashboard", { shop_uuid: shopId });
    if (error) throw error;
    return data;
  }

  // === INVENTORY ===
  static async getInventoryTransactions(shopId: string, productId?: string): Promise<any[]> {
    let query = supabase.from("inventory_transactions").select("*, product:product_id(name)").eq("shop_id", shopId);
    if (productId) query = query.eq("product_id", productId);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async adjustStock(productId: string, quantity: number, reason: string, shopId: string): Promise<void> {
    const { error } = await supabase.from("inventory_transactions").insert({
      shop_id: shopId,
      product_id: productId,
      type: "adjustment",
      quantity,
      notes: reason,
      performed_by: (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) throw error;
  }

  // === MESSAGES ===
  static async getMessages(shopId: string, customerId: string): Promise<any[]> {
    const { data, error } = await supabase.from("shop_messages").select("*").eq("shop_id", shopId).eq("customer_id", customerId).order("created_at");
    if (error) throw error;
    return data || [];
  }

  static async sendMessage(shopId: string, customerId: string, message: string, senderType: "customer" | "shop" = "customer", productId?: string, orderId?: string): Promise<void> {
    const { error } = await supabase.from("shop_messages").insert({
      shop_id: shopId,
      customer_id: customerId,
      sender_type: senderType,
      message,
      product_id: productId,
      order_id: orderId,
    });
    if (error) throw error;
  }

  static subscribeToMessages(shopId: string, customerId: string, callback: (payload: any) => void) {
    return supabase.channel(`shop_messages:${shopId}:${customerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "shop_messages", filter: `shop_id=eq.${shopId}` }, callback)
      .subscribe();
  }

  // === MARKETPLACE ===
  static async syncToMarketplace(shopId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("shop-marketplace-sync", {
      body: { action: "sync_all", shop_id: shopId },
    });
    if (error) throw error;
  }

  static async searchMarketplace(query?: string, category?: string, lat?: number, lng?: number): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke("shop-marketplace-sync", {
      body: { action: "search", query, category, lat, lng },
    });
    if (error) throw error;
    return data.listings || [];
  }
}
