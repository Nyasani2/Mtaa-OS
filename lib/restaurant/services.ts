// ============================================================================
// MTAA Restaurant Module — Services Layer
// API client wrappers for all 8 edge functions
// ============================================================================

import { supabase } from '@/lib/supabase';
import type {
  Order, OrderItem, OrderStatus,
  KdsTicket, KdsStation,
  AttendanceRecord, PayrollRecord,
  InventoryItem, InventoryTransaction,
  MenuItem, MenuCategory,
  TableRecord, Reservation,
  ReportMetrics, SalesReport
} from './types';

const EDGE_BASE = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1';

// ── Auth helper ─────────────────────────────────────────────────────────────
async function edgeFetch(path: string, opts?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${EDGE_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`,
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Edge function error: ${res.status}`);
  }
  return res.json();
}

// ════════════════════════════════════════════════════════════════════════════
// 1. ORDER SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const orderService = {
  /** Create a new order */
  async createOrder(payload: {
    table_id?: string;
    customer_id?: string;
    order_type: 'dine_in' | 'takeaway' | 'delivery';
    items: Array<{
      menu_item_id: string;
      quantity: number;
      modifiers?: Record<string, any>;
      notes?: string;
    }>;
    notes?: string;
    delivery_address?: Record<string, any>;
  }): Promise<Order> {
    return edgeFetch('/restaurant-orders', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', payload }),
    });
  },

  /** Get order by ID */
  async getOrder(orderId: string): Promise<Order> {
    return edgeFetch(`/restaurant-orders?id=${orderId}&action=get`);
  },

  /** List orders with filters */
  async listOrders(filters?: {
    status?: OrderStatus;
    table_id?: string;
    customer_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const params = new URLSearchParams({ action: 'list' });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v));
      });
    }
    return edgeFetch(`/restaurant-orders?${params.toString()}`);
  },

  /** Update order status */
  async updateStatus(orderId: string, status: OrderStatus, reason?: string): Promise<Order> {
    return edgeFetch('/restaurant-orders', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_status', orderId, status, reason }),
    });
  },

  /** Add items to existing order */
  async addItems(orderId: string, items: Array<{
    menu_item_id: string;
    quantity: number;
    modifiers?: Record<string, any>;
    notes?: string;
  }>): Promise<Order> {
    return edgeFetch('/restaurant-orders', {
      method: 'POST',
      body: JSON.stringify({ action: 'add_items', orderId, items }),
    });
  },

  /** Void an item */
  async voidItem(orderId: string, itemId: string, reason: string): Promise<Order> {
    return edgeFetch('/restaurant-orders', {
      method: 'POST',
      body: JSON.stringify({ action: 'void_item', orderId, itemId, reason }),
    });
  },

  /** Process payment */
  async processPayment(orderId: string, payload: {
    method: 'cash' | 'card' | 'wallet' | 'mpesa';
    amount: number;
    tip?: number;
    split_with?: string[];
  }): Promise<{ order: Order; transaction_id: string }> {
    return edgeFetch('/restaurant-orders', {
      method: 'POST',
      body: JSON.stringify({ action: 'payment', orderId, payload }),
    });
  },

  /** Split bill */
  async splitBill(orderId: string, splits: Array<{
    amount: number;
    method: string;
    customer_id?: string;
  }>): Promise<Order> {
    return edgeFetch('/restaurant-orders', {
      method: 'POST',
      body: JSON.stringify({ action: 'split', orderId, splits }),
    });
  },

  /** Cancel order */
  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    return edgeFetch('/restaurant-orders', {
      method: 'POST',
      body: JSON.stringify({ action: 'cancel', orderId, reason }),
    });
  },

  /** Get active orders for a table */
  async getTableOrders(tableId: string): Promise<Order[]> {
    return edgeFetch(`/restaurant-orders?action=table_orders&table_id=${tableId}`);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. KDS SERVICE (Kitchen Display System)
// ════════════════════════════════════════════════════════════════════════════

export const kdsService = {
  /** Get all tickets for a station */
  async getTickets(stationId?: string, filters?: {
    status?: 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';
    priority?: 'normal' | 'rush' | 'delayed';
    limit?: number;
  }): Promise<KdsTicket[]> {
    const params = new URLSearchParams({ action: 'get_tickets' });
    if (stationId) params.append('station_id', stationId);
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v));
      });
    }
    return edgeFetch(`/restaurant-kds?${params.toString()}`);
  },

  /** Update ticket status */
  async updateTicketStatus(ticketId: string, status: string, chefId?: string): Promise<KdsTicket> {
    return edgeFetch('/restaurant-kds', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_status', ticketId, status, chefId }),
    });
  },

  /** Mark item as started */
  async startItem(ticketId: string, itemId: string, chefId: string): Promise<KdsTicket> {
    return edgeFetch('/restaurant-kds', {
      method: 'POST',
      body: JSON.stringify({ action: 'start_item', ticketId, itemId, chefId }),
    });
  },

  /** Mark item as complete */
  async completeItem(ticketId: string, itemId: string, chefId: string): Promise<KdsTicket> {
    return edgeFetch('/restaurant-kds', {
      method: 'POST',
      body: JSON.stringify({ action: 'complete_item', ticketId, itemId, chefId }),
    });
  },

  /** Bump ticket (serve all items) */
  async bumpTicket(ticketId: string, serverId: string): Promise<KdsTicket> {
    return edgeFetch('/restaurant-kds', {
      method: 'POST',
      body: JSON.stringify({ action: 'bump', ticketId, serverId }),
    });
  },

  /** Get stations list */
  async getStations(): Promise<KdsStation[]> {
    return edgeFetch('/restaurant-kds?action=get_stations');
  },

  /** Get ticket metrics */
  async getMetrics(period: 'today' | 'week' | 'month'): Promise<{
    avg_prep_time: number;
    tickets_completed: number;
    tickets_pending: number;
    items_delayed: number;
  }> {
    return edgeFetch(`/restaurant-kds?action=metrics&period=${period}`);
  },

  /** Subscribe to realtime ticket updates */
  subscribeToTickets(callback: (ticket: KdsTicket) => void) {
    return supabase
      .channel('kds_tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_kds_tickets' },
        (payload) => callback(payload.new as KdsTicket)
      )
      .subscribe();
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 3. ATTENDANCE SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const attendanceService = {
  /** Clock in with PIN verification */
  async clockIn(payload: {
    staff_id: string;
    pin: string;
    location?: { lat: number; lng: number };
    device_id?: string;
  }): Promise<AttendanceRecord> {
    return edgeFetch('/restaurant-attendance', {
      method: 'POST',
      body: JSON.stringify({ action: 'clock_in', payload }),
    });
  },

  /** Clock out */
  async clockOut(payload: {
    staff_id: string;
    pin: string;
    location?: { lat: number; lng: number };
  }): Promise<AttendanceRecord> {
    return edgeFetch('/restaurant-attendance', {
      method: 'POST',
      body: JSON.stringify({ action: 'clock_out', payload }),
    });
  },

  /** Get today's attendance for a staff member */
  async getToday(staffId: string): Promise<AttendanceRecord | null> {
    return edgeFetch(`/restaurant-attendance?action=today&staff_id=${staffId}`);
  },

  /** List attendance records with filters */
  async list(filters?: {
    staff_id?: string;
    date_from?: string;
    date_to?: string;
    status?: 'present' | 'late' | 'absent' | 'on_leave';
    limit?: number;
    offset?: number;
  }): Promise<{ records: AttendanceRecord[]; total: number }> {
    const params = new URLSearchParams({ action: 'list' });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v));
      });
    }
    return edgeFetch(`/restaurant-attendance?${params.toString()}`);
  },

  /** Get weekly hours summary */
  async getWeeklyHours(staffId: string, weekStart?: string): Promise<{
    total_hours: number;
    regular_hours: number;
    overtime_hours: number;
    days_worked: number;
  }> {
    const params = new URLSearchParams({ action: 'weekly_hours', staff_id: staffId });
    if (weekStart) params.append('week_start', weekStart);
    return edgeFetch(`/restaurant-attendance?${params.toString()}`);
  },

  /** Get all staff on duty now */
  async getOnDuty(): Promise<AttendanceRecord[]> {
    return edgeFetch('/restaurant-attendance?action=on_duty');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 4. PAYROLL SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const payrollService = {
  /** Generate payroll for a staff member */
  async generatePayroll(staffId: string, period: {
    start_date: string;
    end_date: string;
  }): Promise<PayrollRecord> {
    return edgeFetch('/restaurant-payroll', {
      method: 'POST',
      body: JSON.stringify({ action: 'generate', staffId, period }),
    });
  },

  /** Get payslip */
  async getPayslip(payrollId: string): Promise<PayrollRecord> {
    return edgeFetch(`/restaurant-payroll?action=get&id=${payrollId}`);
  },

  /** List payroll records */
  async list(filters?: {
    staff_id?: string;
    status?: 'draft' | 'approved' | 'paid' | 'disputed';
    period_start?: string;
    period_end?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ records: PayrollRecord[]; total: number }> {
    const params = new URLSearchParams({ action: 'list' });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v));
      });
    }
    return edgeFetch(`/restaurant-payroll?${params.toString()}`);
  },

  /** Approve payroll */
  async approve(payrollId: string, approvedBy: string): Promise<PayrollRecord> {
    return edgeFetch('/restaurant-payroll', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', payrollId, approvedBy }),
    });
  },

  /** Mark as paid */
  async markPaid(payrollId: string, paymentRef: string): Promise<PayrollRecord> {
    return edgeFetch('/restaurant-payroll', {
      method: 'POST',
      body: JSON.stringify({ action: 'mark_paid', payrollId, paymentRef }),
    });
  },

  /** Get tax summary for period */
  async getTaxSummary(period: { start_date: string; end_date: string }): Promise<{
    total_gross: number;
    total_tax: number;
    total_ni: number;
    total_pension: number;
    total_net: number;
    employee_count: number;
  }> {
    return edgeFetch('/restaurant-payroll', {
      method: 'POST',
      body: JSON.stringify({ action: 'tax_summary', period }),
    });
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5. INVENTORY SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const inventoryService = {
  /** Get all inventory items */
  async getItems(filters?: {
    category?: string;
    low_stock?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: InventoryItem[]; total: number }> {
    const params = new URLSearchParams({ action: 'get_items' });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v));
      });
    }
    return edgeFetch(`/restaurant-inventory?${params.toString()}`);
  },

  /** Create inventory item */
  async createItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    return edgeFetch('/restaurant-inventory', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', item }),
    });
  },

  /** Update inventory item */
  async updateItem(itemId: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    return edgeFetch('/restaurant-inventory', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', itemId, updates }),
    });
  },

  /** Record stock transaction */
  async recordTransaction(payload: {
    item_id: string;
    type: 'purchase' | 'usage' | 'waste' | 'adjustment' | 'transfer';
    quantity: number;
    unit_cost?: number;
    reason?: string;
    supplier_id?: string;
    order_id?: string;
  }): Promise<InventoryTransaction> {
    return edgeFetch('/restaurant-inventory', {
      method: 'POST',
      body: JSON.stringify({ action: 'transaction', payload }),
    });
  },

  /** Get low stock alerts */
  async getLowStock(): Promise<InventoryItem[]> {
    return edgeFetch('/restaurant-inventory?action=low_stock');
  },

  /** Get transaction history */
  async getTransactions(itemId?: string, filters?: {
    type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<{ transactions: InventoryTransaction[]; total: number }> {
    const params = new URLSearchParams({ action: 'transactions' });
    if (itemId) params.append('item_id', itemId);
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v));
      });
    }
    return edgeFetch(`/restaurant-inventory?${params.toString()}`);
  },

  /** Get stock valuation */
  async getValuation(): Promise<{
    total_value: number;
    by_category: Record<string, number>;
    item_count: number;
  }> {
    return edgeFetch('/restaurant-inventory?action=valuation');
  },

  /** Subscribe to low stock alerts */
  subscribeToLowStock(callback: (items: InventoryItem[]) => void) {
    return supabase
      .channel('inventory_low_stock')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'restaurant_inventory' },
        (payload) => {
          const item = payload.new as InventoryItem;
          if (item.current_quantity <= item.reorder_level) {
            callback([item]);
          }
        }
      )
      .subscribe();
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 6. REPORTS SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const reportsService = {
  /** Get dashboard metrics */
  async getDashboardMetrics(date?: string): Promise<ReportMetrics> {
    const params = new URLSearchParams({ action: 'dashboard' });
    if (date) params.append('date', date);
    return edgeFetch(`/restaurant-reports?${params.toString()}`);
  },

  /** Get daily sales report */
  async getDailySales(date: string): Promise<SalesReport> {
    return edgeFetch(`/restaurant-reports?action=daily_sales&date=${date}`);
  },

  /** Get sales by period */
  async getSalesByPeriod(period: 'day' | 'week' | 'month' | 'year', date: string): Promise<{
    labels: string[];
    sales: number[];
    orders: number[];
    average_ticket: number[];
  }> {
    return edgeFetch(`/restaurant-reports?action=sales_period&period=${period}&date=${date}`);
  },

  /** Get profit & loss */
  async getProfitLoss(startDate: string, endDate: string): Promise<{
    revenue: number;
    cogs: number;
    gross_profit: number;
    labor_cost: number;
    operating_expenses: number;
    net_profit: number;
    profit_margin: number;
  }> {
    return edgeFetch(`/restaurant-reports?action=p&l&start_date=${startDate}&end_date=${endDate}`);
  },

  /** Get top selling items */
  async getTopItems(period: string, limit?: number): Promise<Array<{
    menu_item_id: string;
    name: string;
    quantity_sold: number;
    revenue: number;
  }>> {
    const params = new URLSearchParams({ action: 'top_items', period });
    if (limit) params.append('limit', String(limit));
    return edgeFetch(`/restaurant-reports?${params.toString()}`);
  },

  /** Get staff performance */
  async getStaffPerformance(staffId?: string, period?: string): Promise<Array<{
    staff_id: string;
    name: string;
    orders_served: number;
    sales_total: number;
    avg_ticket: number;
    tips: number;
  }>> {
    const params = new URLSearchParams({ action: 'staff_performance' });
    if (staffId) params.append('staff_id', staffId);
    if (period) params.append('period', period);
    return edgeFetch(`/restaurant-reports?${params.toString()}`);
  },

  /** Export report to CSV */
  async exportCSV(reportType: string, filters: Record<string, any>): Promise<{ download_url: string }> {
    return edgeFetch('/restaurant-reports', {
      method: 'POST',
      body: JSON.stringify({ action: 'export_csv', reportType, filters }),
    });
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 7. MENU SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const menuService = {
  /** Get all menu categories */
  async getCategories(): Promise<MenuCategory[]> {
    return edgeFetch('/restaurant-menu?action=categories');
  },

  /** Create category */
  async createCategory(category: Omit<MenuCategory, 'id' | 'created_at'>): Promise<MenuCategory> {
    return edgeFetch('/restaurant-menu', {
      method: 'POST',
      body: JSON.stringify({ action: 'create_category', category }),
    });
  },

  /** Get menu items */
  async getItems(filters?: {
    category_id?: string;
    available?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: MenuItem[]; total: number }> {
    const params = new URLSearchParams({ action: 'items' });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v));
      });
    }
    return edgeFetch(`/restaurant-menu?${params.toString()}`);
  },

  /** Create menu item */
  async createItem(item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    return edgeFetch('/restaurant-menu', {
      method: 'POST',
      body: JSON.stringify({ action: 'create_item', item }),
    });
  },

  /** Update menu item */
  async updateItem(itemId: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    return edgeFetch('/restaurant-menu', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_item', itemId, updates }),
    });
  },

  /** Toggle availability */
  async toggleAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    return edgeFetch('/restaurant-menu', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle_availability', itemId, available }),
    });
  },

  /** Delete menu item */
  async deleteItem(itemId: string): Promise<void> {
    return edgeFetch('/restaurant-menu', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete_item', itemId }),
    });
  },

  /** Get item by ID */
  async getItem(itemId: string): Promise<MenuItem> {
    return edgeFetch(`/restaurant-menu?action=item&id=${itemId}`);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 8. TABLE SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const tableService = {
  /** Get all tables */
  async getTables(filters?: {
    status?: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'out_of_order';
    section?: string;
    capacity?: number;
  }): Promise<{ tables: TableRecord[]; total: number }> {
    const params = new URLSearchParams({ action: 'tables' });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v));
      });
    }
    return edgeFetch(`/restaurant-tables?${params.toString()}`);
  },

  /** Create table */
  async createTable(table: Omit<TableRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TableRecord> {
    return edgeFetch('/restaurant-tables', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', table }),
    });
  },

  /** Update table */
  async updateTable(tableId: string, updates: Partial<TableRecord>): Promise<TableRecord> {
    return edgeFetch('/restaurant-tables', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', tableId, updates }),
    });
  },

  /** Update table status */
  async updateStatus(tableId: string, status: TableRecord['status']): Promise<TableRecord> {
    return edgeFetch('/restaurant-tables', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_status', tableId, status }),
    });
  },

  /** Create reservation */
  async createReservation(reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): Promise<Reservation> {
    return edgeFetch('/restaurant-tables', {
      method: 'POST',
      body: JSON.stringify({ action: 'create_reservation', reservation }),
    });
  },

  /** Get reservations */
  async getReservations(filters?: {
    date?: string;
    table_id?: string;
    status?: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
    limit?: number;
  }): Promise<{ reservations: Reservation[]; total: number }> {
    const params = new URLSearchParams({ action: 'reservations' });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v));
      });
    }
    return edgeFetch(`/restaurant-tables?${params.toString()}`);
  },

  /** Update reservation */
  async updateReservation(reservationId: string, updates: Partial<Reservation>): Promise<Reservation> {
    return edgeFetch('/restaurant-tables', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_reservation', reservationId, updates }),
    });
  },

  /** Cancel reservation */
  async cancelReservation(reservationId: string, reason: string): Promise<Reservation> {
    return edgeFetch('/restaurant-tables', {
      method: 'POST',
      body: JSON.stringify({ action: 'cancel_reservation', reservationId, reason }),
    });
  },

  /** Get floor plan */
  async getFloorPlan(): Promise<{
    sections: Array<{ id: string; name: string; color: string }>;
    tables: TableRecord[];
  }> {
    return edgeFetch('/restaurant-tables?action=floor_plan');
  },

  /** Merge tables */
  async mergeTables(tableIds: string[], partySize: number): Promise<TableRecord> {
    return edgeFetch('/restaurant-tables', {
      method: 'POST',
      body: JSON.stringify({ action: 'merge', tableIds, partySize }),
    });
  },
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORT ALL SERVICES
// ════════════════════════════════════════════════════════════════════════════

export {
  orderService,
  kdsService,
  attendanceService,
  payrollService,
  inventoryService,
  reportsService,
  menuService,
  tableService,
};

export default {
  orders: orderService,
  kds: kdsService,
  attendance: attendanceService,
  payroll: payrollService,
  inventory: inventoryService,
  reports: reportsService,
  menu: menuService,
  tables: tableService,
};
