import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopService } from '../services/shopService';
import type { ShopItem, CartItem, OrderInput } from '../types';

export function useShop() {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['streets', 'shop', 'items', selectedCategory, searchQuery],
    queryFn: () => shopService.getItems({ category: selectedCategory, search: searchQuery }),
  });

  const { data: orders } = useQuery({
    queryKey: ['streets', 'shop', 'orders'],
    queryFn: () => shopService.getOrders(),
  });

  const addToCart = useCallback((item: ShopItem, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(c => c.itemId === item.id);
      if (existing) {
        return prev.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + quantity } : c);
      }
      return [...prev, { itemId: item.id, item, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(c => c.itemId !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(c => c.itemId === itemId ? { ...c, quantity } : c));
  }, [removeFromCart]);

  const placeOrder = useMutation({
    mutationFn: (input: OrderInput) => shopService.placeOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'shop', 'orders'] });
      setCart([]);
    },
  });

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return {
    items,
    orders,
    cart,
    cartTotal,
    cartCount,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    addToCart,
    removeFromCart,
    updateQuantity,
    placeOrder,
  };
}
