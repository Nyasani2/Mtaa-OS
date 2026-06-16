// ============================================================================
// MTAA Restaurant Module — TypeScript Types
// Matches the edge function contracts and frontend expectations
// ============================================================================

// ── Enums ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'mpesa';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'out_of_order';
export type ReservationStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
export type KdsTicketStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';
export type KdsPriority = 'normal' | 'rush' | 'delayed';
export type InventoryTransactionType = 'purchase' | 'usage' | 'waste' | 'adjustment' | 'transfer';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'on_leave';
export type PayrollStatus = 'draft' | 'approved' | 'paid' | 'disputed';
export type StaffRole = 'manager' | 'chef' | 'sous_chef' | 'server' | 'bartender' | 'host' | 'dishwasher' | 'cashier';
export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// ── Menu ───────────────────────────────────────────────────────────────────

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  color?: string;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  preparation_time: number;
  allergens?: string[];
  dietary_tags?: string[];
  modifiers?: Record<string, any>[];
  created_at: string;
  updated_at: string;
}

// ── Tables ─────────────────────────────────────────────────────────────────

export interface TableRecord {
  id: string;
  table_number: string;
  section?: string;
  section_id?: string;
  capacity: number;
  status: TableStatus;
  position_x: number;
  position_y: number;
  shape: 'circle' | 'square' | 'rectangle';
  merged_from?: string[];
  merged_into?: string;
  party_size?: number;
  current_order_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  table_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  party_size: number;
  reservation_time: string;
  duration_minutes: number;
  status: ReservationStatus;
  special_requests?: string;
  cancel_reason?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ── Orders ─────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  modifiers?: Record<string, any>[];
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'voided';
  void_reason?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  table_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: OrderType;
  status: OrderStatus;
  status_reason?: string;
  cancel_reason?: string;
  total_amount: number;
  tax_amount: number;
  tip_amount: number;
  discount_amount: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  payment_method?: string;
  notes?: string;
  delivery_address?: Record<string, any>;
  server_id?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
  paid_at?: string;
  completed_at?: string;
}

export interface OrderSplit {
  id: string;
  order_id: string;
  split_index: number;
  amount: number;
  method?: string;
  customer_id?: string;
  status: 'pending' | 'paid';
  created_at: string;
}

// ── KDS ────────────────────────────────────────────────────────────────────

export interface KdsStation {
  id: string;
  name: string;
  station_type: 'kitchen' | 'bar' | 'grill' | 'pastry';
  color?: string;
  is_active: boolean;
  created_at: string;
}

export interface KdsTicketItem {
  id: string;
  ticket_id: string;
  order_item_id?: string;
  item_name: string;
  quantity: number;
  status: 'pending' | 'cooking' | 'ready' | 'served';
  chef_id?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface KdsTicket {
  id: string;
  order_id: string;
  station_id?: string;
  ticket_number?: string;
  priority: KdsPriority;
  status: KdsTicketStatus;
  chef_id?: string;
  server_id?: string;
  prep_time_seconds?: number;
  items?: KdsTicketItem[];
  created_at: string;
  updated_at: string;
  started_at?: string;
  served_at?: string;
}

// ── Inventory ──────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  unit_of_measure: string;
  current_quantity: number;
  reorder_level: number;
  reorder_quantity: number;
  unit_cost: number;
  selling_price?: number;
  supplier_id?: string;
  storage_location?: string;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  type: InventoryTransactionType;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reason?: string;
  supplier_id?: string;
  order_id?: string;
  performed_by?: string;
  created_at: string;
}

// ── Staff ──────────────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: StaffRole;
  hourly_rate: number;
  salary?: number;
  tax_rate: number;
  ni_rate: number;
  pension_rate: number;
  pin_hash?: string;
  is_active: boolean;
  hire_date?: string;
  created_at: string;
  updated_at: string;
}

// ── Attendance ───────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  staff?: StaffMember;
  clock_in: string;
  clock_out?: string;
  location?: { lat: number; lng: number };
  location_out?: { lat: number; lng: number };
  device_id?: string;
  hours_worked?: number;
  status: AttendanceStatus;
  notes?: string;
  created_at: string;
}

// ── Payroll ────────────────────────────────────────────────────────────────

export interface PayrollRecord {
  id: string;
  staff_id: string;
  staff?: StaffMember;
  period_start: string;
  period_end: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  regular_pay: number;
  overtime_pay: number;
  gross_pay: number;
  tax_deduction: number;
  ni_deduction: number;
  pension_deduction: number;
  other_deductions: number;
  net_pay: number;
  status: PayrollStatus;
  approved_by?: string;
  approved_at?: string;
  payment_ref?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// ── Customers ──────────────────────────────────────────────────────────────

export interface RestaurantCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  visit_count: number;
  total_spent: number;
  loyalty_points: number;
  tier: CustomerTier;
  preferences?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Reports ────────────────────────────────────────────────────────────────

export interface ReportMetrics {
  total_sales: number;
  total_tips: number;
  order_count: number;
  average_ticket: number;
  occupied_tables: number;
  total_tables: number;
  table_occupancy_rate: number;
  pending_orders: number;
  low_stock_items: number;
  staff_on_duty: number;
}

export interface SalesReport {
  date: string;
  hourly_breakdown: Record<string, { sales: number; orders: number; tips: number }>;
  total_sales: number;
  total_orders: number;
  total_tips: number;
}

export interface ProfitLossReport {
  revenue: number;
  cogs: number;
  gross_profit: number;
  labor_cost: number;
  operating_expenses: number;
  net_profit: number;
  profit_margin: number;
}

export interface TopItemReport {
  menu_item_id: string;
  name: string;
  quantity_sold: number;
  revenue: number;
}

export interface StaffPerformanceReport {
  staff_id: string;
  name: string;
  orders_served: number;
  sales_total: number;
  avg_ticket: number;
  tips: number;
}

// ── Floor Plan ─────────────────────────────────────────────────────────────

export interface FloorPlan {
  sections: Array<{ id: string; name: string; color: string }>;
  tables: TableRecord[];
}

// ── Service Response Types ─────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items?: T[];
  records?: T[];
  total: number;
}

export interface OrderPaymentResponse {
  order: Order;
  transaction_id: string;
}
