// ============================================================================
// MTAA Restaurant Module — State Layer (Zustand Stores)
// ============================================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Order, OrderStatus, KdsTicket, KdsStation,
  AttendanceRecord, PayrollRecord,
  InventoryItem, InventoryTransaction,
  MenuItem, MenuCategory,
  TableRecord, Reservation,
  ReportMetrics, SalesReport
} from '@/lib/restaurant/types';
import {
  orderService, kdsService, attendanceService,
  payrollService, inventoryService, reportsService,
  menuService, tableService
} from '@/lib/restaurant/services';

// ── Order Store ──────────────────────────────────────────────────────────────

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  activeOrders: Order[];
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: OrderStatus;
    table_id?: string;
    date_from?: string;
    date_to?: string;
  };

  // Actions
  setFilters: (filters: Partial<OrderState['filters']>) => void;
  loadOrders: () => Promise<void>;
  loadOrder: (id: string) => Promise<void>;
  createOrder: (payload: Parameters<typeof orderService.createOrder>[0]) => Promise<Order>;
  updateStatus: (id: string, status: OrderStatus, reason?: string) => Promise<void>;
  addItems: (id: string, items: any[]) => Promise<void>;
  voidItem: (orderId: string, itemId: string, reason: string) => Promise<void>;
  processPayment: (id: string, payload: any) => Promise<void>;
  cancelOrder: (id: string, reason: string) => Promise<void>;
  loadTableOrders: (tableId: string) => Promise<void>;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  activeOrders: [],
  isLoading: false,
  error: null,
  filters: {},

  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),

  loadOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const { orders, total } = await orderService.listOrders(get().filters);
      set({ orders, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadOrder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.getOrder(id);
      set({ currentOrder: order, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  createOrder: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.createOrder(payload);
      set((s) => ({
        orders: [order, ...s.orders],
        currentOrder: order,
        isLoading: false,
      }));
      return order;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  updateStatus: async (id, status, reason) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.updateStatus(id, status, reason);
      set((s) => ({
        orders: s.orders.map((o) => (o.id === id ? order : o)),
        currentOrder: s.currentOrder?.id === id ? order : s.currentOrder,
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  addItems: async (id, items) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.addItems(id, items);
      set((s) => ({
        orders: s.orders.map((o) => (o.id === id ? order : o)),
        currentOrder: s.currentOrder?.id === id ? order : s.currentOrder,
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  voidItem: async (orderId, itemId, reason) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.voidItem(orderId, itemId, reason);
      set((s) => ({
        orders: s.orders.map((o) => (o.id === orderId ? order : o)),
        currentOrder: s.currentOrder?.id === orderId ? order : s.currentOrder,
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  processPayment: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const { order } = await orderService.processPayment(id, payload);
      set((s) => ({
        orders: s.orders.map((o) => (o.id === id ? order : o)),
        currentOrder: s.currentOrder?.id === id ? order : s.currentOrder,
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  cancelOrder: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.cancelOrder(id, reason);
      set((s) => ({
        orders: s.orders.map((o) => (o.id === id ? order : o)),
        currentOrder: s.currentOrder?.id === id ? order : s.currentOrder,
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadTableOrders: async (tableId) => {
    set({ isLoading: true, error: null });
    try {
      const orders = await orderService.getTableOrders(tableId);
      set({ activeOrders: orders, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// ── KDS Store ───────────────────────────────────────────────────────────────

interface KdsState {
  tickets: KdsTicket[];
  stations: KdsStation[];
  selectedStation: string | null;
  isLoading: boolean;
  error: string | null;
  metrics: {
    avg_prep_time: number;
    tickets_completed: number;
    tickets_pending: number;
    items_delayed: number;
  } | null;

  loadTickets: (stationId?: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: string, chefId?: string) => Promise<void>;
  startItem: (ticketId: string, itemId: string, chefId: string) => Promise<void>;
  completeItem: (ticketId: string, itemId: string, chefId: string) => Promise<void>;
  bumpTicket: (ticketId: string, serverId: string) => Promise<void>;
  loadStations: () => Promise<void>;
  loadMetrics: (period: 'today' | 'week' | 'month') => Promise<void>;
  setSelectedStation: (id: string | null) => void;
  clearError: () => void;
}

export const useKdsStore = create<KdsState>((set, get) => ({
  tickets: [],
  stations: [],
  selectedStation: null,
  isLoading: false,
  error: null,
  metrics: null,

  loadTickets: async (stationId) => {
    set({ isLoading: true, error: null });
    try {
      const tickets = await kdsService.getTickets(stationId || get().selectedStation || undefined);
      set({ tickets, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  updateTicketStatus: async (ticketId, status, chefId) => {
    try {
      const ticket = await kdsService.updateTicketStatus(ticketId, status, chefId);
      set((s) => ({
        tickets: s.tickets.map((t) => (t.id === ticketId ? ticket : t)),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  startItem: async (ticketId, itemId, chefId) => {
    try {
      const ticket = await kdsService.startItem(ticketId, itemId, chefId);
      set((s) => ({
        tickets: s.tickets.map((t) => (t.id === ticketId ? ticket : t)),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  completeItem: async (ticketId, itemId, chefId) => {
    try {
      const ticket = await kdsService.completeItem(ticketId, itemId, chefId);
      set((s) => ({
        tickets: s.tickets.map((t) => (t.id === ticketId ? ticket : t)),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  bumpTicket: async (ticketId, serverId) => {
    try {
      const ticket = await kdsService.bumpTicket(ticketId, serverId);
      set((s) => ({
        tickets: s.tickets.filter((t) => t.id !== ticketId),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadStations: async () => {
    set({ isLoading: true, error: null });
    try {
      const stations = await kdsService.getStations();
      set({ stations, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadMetrics: async (period) => {
    try {
      const metrics = await kdsService.getMetrics(period);
      set({ metrics });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  setSelectedStation: (id) => set({ selectedStation: id }),
  clearError: () => set({ error: null }),
}));

// ── Attendance Store ────────────────────────────────────────────────────────

interface AttendanceState {
  records: AttendanceRecord[];
  todayRecord: AttendanceRecord | null;
  onDuty: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;

  clockIn: (payload: Parameters<typeof attendanceService.clockIn>[0]) => Promise<void>;
  clockOut: (payload: Parameters<typeof attendanceService.clockOut>[0]) => Promise<void>;
  loadToday: (staffId: string) => Promise<void>;
  loadRecords: (filters?: Parameters<typeof attendanceService.list>[0]) => Promise<void>;
  loadOnDuty: () => Promise<void>;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  records: [],
  todayRecord: null,
  onDuty: [],
  isLoading: false,
  error: null,

  clockIn: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const record = await attendanceService.clockIn(payload);
      set((s) => ({
        records: [record, ...s.records],
        todayRecord: record,
        onDuty: [...s.onDuty, record],
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  clockOut: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const record = await attendanceService.clockOut(payload);
      set((s) => ({
        records: s.records.map((r) => (r.id === record.id ? record : r)),
        todayRecord: record,
        onDuty: s.onDuty.filter((r) => r.staff_id !== payload.staff_id),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadToday: async (staffId) => {
    set({ isLoading: true, error: null });
    try {
      const record = await attendanceService.getToday(staffId);
      set({ todayRecord: record, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadRecords: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const { records } = await attendanceService.list(filters);
      set({ records, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadOnDuty: async () => {
    set({ isLoading: true, error: null });
    try {
      const onDuty = await attendanceService.getOnDuty();
      set({ onDuty, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// ── Payroll Store ───────────────────────────────────────────────────────────

interface PayrollState {
  records: PayrollRecord[];
  currentRecord: PayrollRecord | null;
  taxSummary: any;
  isLoading: boolean;
  error: string | null;

  generate: (staffId: string, period: any) => Promise<void>;
  loadPayslip: (id: string) => Promise<void>;
  loadRecords: (filters?: any) => Promise<void>;
  approve: (id: string, by: string) => Promise<void>;
  markPaid: (id: string, ref: string) => Promise<void>;
  loadTaxSummary: (period: any) => Promise<void>;
  clearError: () => void;
}

export const usePayrollStore = create<PayrollState>((set) => ({
  records: [],
  currentRecord: null,
  taxSummary: null,
  isLoading: false,
  error: null,

  generate: async (staffId, period) => {
    set({ isLoading: true, error: null });
    try {
      const record = await payrollService.generatePayroll(staffId, period);
      set((s) => ({
        records: [record, ...s.records],
        currentRecord: record,
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadPayslip: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const record = await payrollService.getPayslip(id);
      set({ currentRecord: record, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadRecords: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const { records } = await payrollService.list(filters);
      set({ records, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  approve: async (id, by) => {
    set({ isLoading: true, error: null });
    try {
      const record = await payrollService.approve(id, by);
      set((s) => ({
        records: s.records.map((r) => (r.id === id ? record : r)),
        currentRecord: s.currentRecord?.id === id ? record : s.currentRecord,
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  markPaid: async (id, ref) => {
    set({ isLoading: true, error: null });
    try {
      const record = await payrollService.markPaid(id, ref);
      set((s) => ({
        records: s.records.map((r) => (r.id === id ? record : r)),
        currentRecord: s.currentRecord?.id === id ? record : s.currentRecord,
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadTaxSummary: async (period) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await payrollService.getTaxSummary(period);
      set({ taxSummary: summary, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// ── Inventory Store ─────────────────────────────────────────────────────────

interface InventoryState {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  lowStock: InventoryItem[];
  isLoading: boolean;
  error: string | null;

  loadItems: (filters?: any) => Promise<void>;
  createItem: (item: any) => Promise<void>;
  updateItem: (id: string, updates: any) => Promise<void>;
  recordTransaction: (payload: any) => Promise<void>;
  loadLowStock: () => Promise<void>;
  loadTransactions: (itemId?: string, filters?: any) => Promise<void>;
  clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  transactions: [],
  lowStock: [],
  isLoading: false,
  error: null,

  loadItems: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const { items } = await inventoryService.getItems(filters);
      set({ items, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  createItem: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const newItem = await inventoryService.createItem(item);
      set((s) => ({ items: [newItem, ...s.items], isLoading: false }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  updateItem: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await inventoryService.updateItem(id, updates);
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? updated : i)),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  recordTransaction: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const tx = await inventoryService.recordTransaction(payload);
      set((s) => ({
        transactions: [tx, ...s.transactions],
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadLowStock: async () => {
    set({ isLoading: true, error: null });
    try {
      const lowStock = await inventoryService.getLowStock();
      set({ lowStock, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadTransactions: async (itemId, filters) => {
    set({ isLoading: true, error: null });
    try {
      const { transactions } = await inventoryService.getTransactions(itemId, filters);
      set({ transactions, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// ── Menu Store ──────────────────────────────────────────────────────────────

interface MenuState {
  items: MenuItem[];
  categories: MenuCategory[];
  currentItem: MenuItem | null;
  isLoading: boolean;
  error: string | null;

  loadCategories: () => Promise<void>;
  loadItems: (filters?: any) => Promise<void>;
  createItem: (item: any) => Promise<void>;
  updateItem: (id: string, updates: any) => Promise<void>;
  toggleAvailability: (id: string, available: boolean) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loadItem: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  items: [],
  categories: [],
  currentItem: null,
  isLoading: false,
  error: null,

  loadCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await menuService.getCategories();
      set({ categories, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadItems: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const { items } = await menuService.getItems(filters);
      set({ items, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  createItem: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const newItem = await menuService.createItem(item);
      set((s) => ({ items: [newItem, ...s.items], isLoading: false }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  updateItem: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await menuService.updateItem(id, updates);
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? updated : i)),
        currentItem: s.currentItem?.id === id ? updated : s.currentItem,
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  toggleAvailability: async (id, available) => {
    try {
      const updated = await menuService.toggleAvailability(id, available);
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? updated : i)),
        currentItem: s.currentItem?.id === id ? updated : s.currentItem,
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  deleteItem: async (id) => {
    try {
      await menuService.deleteItem(id);
      set((s) => ({
        items: s.items.filter((i) => i.id !== id),
        currentItem: s.currentItem?.id === id ? null : s.currentItem,
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadItem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const item = await menuService.getItem(id);
      set({ currentItem: item, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// ── Table Store ─────────────────────────────────────────────────────────────

interface TableState {
  tables: TableRecord[];
  reservations: Reservation[];
  floorPlan: any;
  isLoading: boolean;
  error: string | null;

  loadTables: (filters?: any) => Promise<void>;
  createTable: (table: any) => Promise<void>;
  updateTable: (id: string, updates: any) => Promise<void>;
  updateStatus: (id: string, status: any) => Promise<void>;
  createReservation: (res: any) => Promise<void>;
  loadReservations: (filters?: any) => Promise<void>;
  updateReservation: (id: string, updates: any) => Promise<void>;
  cancelReservation: (id: string, reason: string) => Promise<void>;
  loadFloorPlan: () => Promise<void>;
  mergeTables: (ids: string[], partySize: number) => Promise<void>;
  clearError: () => void;
}

export const useTableStore = create<TableState>((set) => ({
  tables: [],
  reservations: [],
  floorPlan: null,
  isLoading: false,
  error: null,

  loadTables: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const { tables } = await tableService.getTables(filters);
      set({ tables, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  createTable: async (table) => {
    set({ isLoading: true, error: null });
    try {
      const newTable = await tableService.createTable(table);
      set((s) => ({ tables: [newTable, ...s.tables], isLoading: false }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  updateTable: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await tableService.updateTable(id, updates);
      set((s) => ({
        tables: s.tables.map((t) => (t.id === id ? updated : t)),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  updateStatus: async (id, status) => {
    try {
      const updated = await tableService.updateStatus(id, status);
      set((s) => ({
        tables: s.tables.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  createReservation: async (res) => {
    set({ isLoading: true, error: null });
    try {
      const reservation = await tableService.createReservation(res);
      set((s) => ({
        reservations: [reservation, ...s.reservations],
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadReservations: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const { reservations } = await tableService.getReservations(filters);
      set({ reservations, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  updateReservation: async (id, updates) => {
    try {
      const updated = await tableService.updateReservation(id, updates);
      set((s) => ({
        reservations: s.reservations.map((r) => (r.id === id ? updated : r)),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  cancelReservation: async (id, reason) => {
    try {
      const updated = await tableService.cancelReservation(id, reason);
      set((s) => ({
        reservations: s.reservations.map((r) => (r.id === id ? updated : r)),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadFloorPlan: async () => {
    set({ isLoading: true, error: null });
    try {
      const floorPlan = await tableService.getFloorPlan();
      set({ floorPlan, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  mergeTables: async (ids, partySize) => {
    set({ isLoading: true, error: null });
    try {
      const merged = await tableService.mergeTables(ids, partySize);
      set((s) => ({
        tables: s.tables.filter((t) => !ids.includes(t.id)).concat(merged),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// ── Reports Store ─────────────────────────────────────────────────────────

interface ReportsState {
  dashboardMetrics: ReportMetrics | null;
  dailySales: SalesReport | null;
  salesPeriod: any;
  profitLoss: any;
  topItems: any[];
  staffPerformance: any[];
  isLoading: boolean;
  error: string | null;

  loadDashboard: (date?: string) => Promise<void>;
  loadDailySales: (date: string) => Promise<void>;
  loadSalesPeriod: (period: string, date: string) => Promise<void>;
  loadProfitLoss: (start: string, end: string) => Promise<void>;
  loadTopItems: (period: string, limit?: number) => Promise<void>;
  loadStaffPerformance: (staffId?: string, period?: string) => Promise<void>;
  exportCSV: (type: string, filters: any) => Promise<string>;
  clearError: () => void;
}

export const useReportsStore = create<ReportsState>((set) => ({
  dashboardMetrics: null,
  dailySales: null,
  salesPeriod: null,
  profitLoss: null,
  topItems: [],
  staffPerformance: [],
  isLoading: false,
  error: null,

  loadDashboard: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const metrics = await reportsService.getDashboardMetrics(date);
      set({ dashboardMetrics: metrics, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadDailySales: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const report = await reportsService.getDailySales(date);
      set({ dailySales: report, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadSalesPeriod: async (period, date) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportsService.getSalesByPeriod(period as any, date);
      set({ salesPeriod: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadProfitLoss: async (start, end) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportsService.getProfitLoss(start, end);
      set({ profitLoss: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadTopItems: async (period, limit) => {
    set({ isLoading: true, error: null });
    try {
      const items = await reportsService.getTopItems(period, limit);
      set({ topItems: items, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadStaffPerformance: async (staffId, period) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportsService.getStaffPerformance(staffId, period);
      set({ staffPerformance: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  exportCSV: async (type, filters) => {
    set({ isLoading: true, error: null });
    try {
      const { download_url } = await reportsService.exportCSV(type, filters);
      set({ isLoading: false });
      return download_url;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  clearError: () => set({ error: null }),
}));
