/**
 * MTAA OS V10 — useRestaurantPOS Hook
 * Quick order creation from menu items
 */
import { useCallback, useState } from 'react';
import { createRestaurantOrder, RestaurantMenuItem, RestaurantTable } from '@/lib/services/restaurant-service';

export interface POSOrderLine {
  menuItem: RestaurantMenuItem;
  quantity: number;
  instructions: string | null;
}

export function useRestaurantPOS(restaurantId: string) {
  const [lines, setLines] = useState<POSOrderLine[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const addLine = useCallback((menuItem: RestaurantMenuItem, qty = 1, instructions?: string) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((l) => l.menuItem.id === menuItem.id
          ? { ...l, quantity: l.quantity + qty, instructions: instructions ?? l.instructions }
          : l);
      }
      return [...prev, { menuItem, quantity: qty, instructions: instructions ?? null }];
    });
  }, []);

  const removeLine = useCallback((itemId: string) => {
    setLines((prev) => prev.filter((l) => l.menuItem.id !== itemId));
  }, []);

  const updateQty = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) { removeLine(itemId); return; }
    setLines((prev) => prev.map((l) => l.menuItem.id === itemId ? { ...l, quantity: qty } : l));
  }, [removeLine]);

  const clear = useCallback(() => {
    setLines([]);
    setSelectedTable(null);
    setReceipt(null);
  }, []);

  const submit = useCallback(async (customerId?: string, notes?: string) => {
    if (!restaurantId || lines.length === 0) throw new Error('Invalid order');
    setIsProcessing(true);
    try {
      const order = await createRestaurantOrder(
        {
          restaurant_id: restaurantId,
          table_id: selectedTable?.id ?? null,
          customer_id: customerId ?? null,
          type: orderType,
          status: 'pending',
          notes: notes ?? null,
        },
        lines.map((l) => ({
          menu_item_id: l.menuItem.id,
          quantity: l.quantity,
          unit_price: l.menuItem.price,
          total_price: l.menuItem.price * l.quantity,
          special_instructions: l.instructions,
          status: 'pending',
        }))
      );
      setReceipt(order);
      setLines([]);
      return order;
    } finally {
      setIsProcessing(false);
    }
  }, [restaurantId, lines, selectedTable, orderType]);

  const subtotal = lines.reduce((sum, l) => sum + l.menuItem.price * l.quantity, 0);

  return {
    lines, subtotal, selectedTable, orderType, isProcessing, receipt,
    addLine, removeLine, updateQty, clear, submit,
    setSelectedTable, setOrderType,
  };
}
