// ============================================================================
// MTAA Restaurant Module — Hooks Layer
// React hooks for all 8 domain areas
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  useOrderStore,
  useKdsStore,
  useAttendanceStore,
  usePayrollStore,
  useInventoryStore,
  useMenuStore,
  useTableStore,
  useReportsStore,
} from '@/lib/restaurant/state';

// ════════════════════════════════════════════════════════════════════════════
// 1. useOrders Hook
// ════════════════════════════════════════════════════════════════════════════

export function useOrders() {
  const store = useOrderStore();

  return {
    orders: store.orders,
    currentOrder: store.currentOrder,
    activeOrders: store.activeOrders,
    isLoading: store.isLoading,
    error: store.error,
    filters: store.filters,
    setFilters: store.setFilters,
    loadOrders: store.loadOrders,
    loadOrder: store.loadOrder,
    createOrder: store.createOrder,
    updateStatus: store.updateStatus,
    addItems: store.addItems,
    voidItem: store.voidItem,
    processPayment: store.processPayment,
    cancelOrder: store.cancelOrder,
    loadTableOrders: store.loadTableOrders,
    clearError: store.clearError,
  };
}

// Auto-refresh active orders every 30 seconds
export function useActiveOrdersAutoRefresh(tableId?: string) {
  const { loadTableOrders, activeOrders } = useOrders();

  useEffect(() => {
    if (!tableId) return;
    loadTableOrders(tableId);
    const interval = setInterval(() => loadTableOrders(tableId), 30000);
    return () => clearInterval(interval);
  }, [tableId]);

  return activeOrders;
}

// ════════════════════════════════════════════════════════════════════════════
// 2. useKds Hook
// ════════════════════════════════════════════════════════════════════════════

export function useKds() {
  const store = useKdsStore();

  return {
    tickets: store.tickets,
    stations: store.stations,
    selectedStation: store.selectedStation,
    isLoading: store.isLoading,
    error: store.error,
    metrics: store.metrics,
    loadTickets: store.loadTickets,
    updateTicketStatus: store.updateTicketStatus,
    startItem: store.startItem,
    completeItem: store.completeItem,
    bumpTicket: store.bumpTicket,
    loadStations: store.loadStations,
    loadMetrics: store.loadMetrics,
    setSelectedStation: store.setSelectedStation,
    clearError: store.clearError,
  };
}

// Realtime KDS ticket subscription
export function useKdsRealtime(stationId?: string) {
  const { loadTickets, tickets } = useKds();
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadTickets(stationId);
  }, [stationId]);

  useEffect(() => {
    // Import kdsService dynamically to avoid circular deps
    const setup = async () => {
      const { kdsService } = await import('@/lib/restaurant/services');
      const sub = kdsService.subscribeToTickets((ticket) => {
        loadTickets(stationId);
      });
      setSubscription(sub);
    };
    setup();

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [stationId]);

  return tickets;
}

// ════════════════════════════════════════════════════════════════════════════
// 3. useAttendance Hook
// ════════════════════════════════════════════════════════════════════════════

export function useAttendance() {
  const store = useAttendanceStore();

  return {
    records: store.records,
    todayRecord: store.todayRecord,
    onDuty: store.onDuty,
    isLoading: store.isLoading,
    error: store.error,
    clockIn: store.clockIn,
    clockOut: store.clockOut,
    loadToday: store.loadToday,
    loadRecords: store.loadRecords,
    loadOnDuty: store.loadOnDuty,
    clearError: store.clearError,
  };
}

// Check if staff is currently clocked in
export function useIsClockedIn(staffId: string) {
  const { todayRecord, loadToday } = useAttendance();
  const [isClockedIn, setIsClockedIn] = useState(false);

  useEffect(() => {
    if (staffId) loadToday(staffId);
  }, [staffId]);

  useEffect(() => {
    setIsClockedIn(
      !!todayRecord && !!todayRecord.clock_in && !todayRecord.clock_out
    );
  }, [todayRecord]);

  return {
    isClockedIn,
    todayRecord,
    refresh: () => loadToday(staffId),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 4. usePayroll Hook
// ════════════════════════════════════════════════════════════════════════════

export function usePayroll() {
  const store = usePayrollStore();

  return {
    records: store.records,
    currentRecord: store.currentRecord,
    taxSummary: store.taxSummary,
    isLoading: store.isLoading,
    error: store.error,
    generate: store.generate,
    loadPayslip: store.loadPayslip,
    loadRecords: store.loadRecords,
    approve: store.approve,
    markPaid: store.markPaid,
    loadTaxSummary: store.loadTaxSummary,
    clearError: store.clearError,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 5. useInventory Hook
// ════════════════════════════════════════════════════════════════════════════

export function useInventory() {
  const store = useInventoryStore();

  return {
    items: store.items,
    transactions: store.transactions,
    lowStock: store.lowStock,
    isLoading: store.isLoading,
    error: store.error,
    loadItems: store.loadItems,
    createItem: store.createItem,
    updateItem: store.updateItem,
    recordTransaction: store.recordTransaction,
    loadLowStock: store.loadLowStock,
    loadTransactions: store.loadTransactions,
    clearError: store.clearError,
  };
}

// Low stock alert hook with auto-refresh
export function useLowStockAlerts() {
  const { lowStock, loadLowStock, loadItems } = useInventory();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadLowStock();
    const interval = setInterval(loadLowStock, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setAlerts(lowStock);
  }, [lowStock]);

  return {
    alerts,
    dismissAlert: (itemId: string) => {
      setAlerts((prev) => prev.filter((a) => a.id !== itemId));
    },
    refresh: loadLowStock,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 6. useMenu Hook
// ════════════════════════════════════════════════════════════════════════════

export function useMenu() {
  const store = useMenuStore();

  return {
    items: store.items,
    categories: store.categories,
    currentItem: store.currentItem,
    isLoading: store.isLoading,
    error: store.error,
    loadCategories: store.loadCategories,
    loadItems: store.loadItems,
    createItem: store.createItem,
    updateItem: store.updateItem,
    toggleAvailability: store.toggleAvailability,
    deleteItem: store.deleteItem,
    loadItem: store.loadItem,
    clearError: store.clearError,
  };
}

// Menu search hook
export function useMenuSearch() {
  const { loadItems, items, isLoading } = useMenu();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadItems({
        search: searchQuery || undefined,
        category_id: categoryFilter || undefined,
        available: true,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, categoryFilter]);

  return {
    items,
    isLoading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 7. useTables Hook
// ════════════════════════════════════════════════════════════════════════════

export function useTables() {
  const store = useTableStore();

  return {
    tables: store.tables,
    reservations: store.reservations,
    floorPlan: store.floorPlan,
    isLoading: store.isLoading,
    error: store.error,
    loadTables: store.loadTables,
    createTable: store.createTable,
    updateTable: store.updateTable,
    updateStatus: store.updateStatus,
    createReservation: store.createReservation,
    loadReservations: store.loadReservations,
    updateReservation: store.updateReservation,
    cancelReservation: store.cancelReservation,
    loadFloorPlan: store.loadFloorPlan,
    mergeTables: store.mergeTables,
    clearError: store.clearError,
  };
}

// Table status with auto-refresh
export function useTableStatus() {
  const { tables, loadTables, isLoading } = useTables();
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadTables();
    const interval = setInterval(loadTables, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const counts: Record<string, number> = {};
    tables.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    setStatusCounts(counts);
  }, [tables]);

  return {
    tables,
    statusCounts,
    isLoading,
    refresh: loadTables,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 8. useReports Hook
// ════════════════════════════════════════════════════════════════════════════

export function useReports() {
  const store = useReportsStore();

  return {
    dashboardMetrics: store.dashboardMetrics,
    dailySales: store.dailySales,
    salesPeriod: store.salesPeriod,
    profitLoss: store.profitLoss,
    topItems: store.topItems,
    staffPerformance: store.staffPerformance,
    isLoading: store.isLoading,
    error: store.error,
    loadDashboard: store.loadDashboard,
    loadDailySales: store.loadDailySales,
    loadSalesPeriod: store.loadSalesPeriod,
    loadProfitLoss: store.loadProfitLoss,
    loadTopItems: store.loadTopItems,
    loadStaffPerformance: store.loadStaffPerformance,
    exportCSV: store.exportCSV,
    clearError: store.clearError,
  };
}

// Dashboard auto-refresh hook
export function useDashboardAutoRefresh(date?: string) {
  const { loadDashboard, dashboardMetrics, isLoading } = useReports();

  useEffect(() => {
    loadDashboard(date);
    const interval = setInterval(() => loadDashboard(date), 30000);
    return () => clearInterval(interval);
  }, [date]);

  return { metrics: dashboardMetrics, isLoading };
}

// ════════════════════════════════════════════════════════════════════════════
// 9. Combined Restaurant Hook (for managers)
// ════════════════════════════════════════════════════════════════════════════

export function useRestaurantManager() {
  const orders = useOrders();
  const kds = useKds();
  const attendance = useAttendance();
  const inventory = useInventory();
  const tables = useTables();
  const reports = useReports();

  const refreshAll = useCallback(async () => {
    await Promise.all([
      orders.loadOrders(),
      kds.loadTickets(),
      attendance.loadOnDuty(),
      inventory.loadLowStock(),
      tables.loadTables(),
      reports.loadDashboard(),
    ]);
  }, []);

  return {
    orders,
    kds,
    attendance,
    inventory,
    tables,
    reports,
    refreshAll,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 10. POS Hook (for waiters/cashiers)
// ════════════════════════════════════════════════════════════════════════════

export function usePos() {
  const orders = useOrders();
  const menu = useMenu();
  const tables = useTables();

  const [cart, setCart] = useState<Array<{
    menuItem: any;
    quantity: number;
    modifiers: Record<string, any>;
    notes: string;
  }>>([]);

  const addToCart = useCallback((menuItem: any, quantity = 1, modifiers = {}, notes = '') => {
    setCart((prev) => {
      const existing = prev.findIndex(
        (i) => i.menuItem.id === menuItem.id && JSON.stringify(i.modifiers) === JSON.stringify(modifiers)
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity += quantity;
        return updated;
      }
      return [...prev, { menuItem, quantity, modifiers, notes }];
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((_, i) => i !== index);
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = useCallback(async (tableId?: string, orderType: 'dine_in' | 'takeaway' | 'delivery' = 'dine_in') => {
    if (cart.length === 0) throw new Error('Cart is empty');
    const items = cart.map((c) => ({
      menu_item_id: c.menuItem.id,
      quantity: c.quantity,
      modifiers: c.modifiers,
      notes: c.notes,
    }));
    const order = await orders.createOrder({
      table_id: tableId,
      order_type: orderType,
      items,
    });
    setCart([]);
    return order;
  }, [cart, orders.createOrder]);

  const clearCart = useCallback(() => setCart([]), []);

  return {
    cart,
    cartTotal,
    cartItemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    submitOrder,
    clearCart,
    orders,
    menu,
    tables,
  };
}
