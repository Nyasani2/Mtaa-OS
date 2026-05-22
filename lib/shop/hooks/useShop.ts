import { useQuery } from "@tanstack/react-query";
import { ShopService } from "@/lib/shop/services/shopService";

export function useMyShops(userId?: string) {
  return useQuery({
    queryKey: ["shops", userId],
    queryFn: () => ShopService.list(),
    enabled: !!userId,
  });
}

export function useShopProducts(shopId?: string) {
  return useQuery({
    queryKey: ["shop-products", shopId],
    queryFn: () => ShopService.list(),
    enabled: !!shopId,
  });
}

export function useShopOrders(shopId?: string) {
  return useQuery({
    queryKey: ["shop-orders", shopId],
    queryFn: () => ShopService.list(),
    enabled: !!shopId,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ["shop-dashboard"],
    queryFn: () => ShopService.list(),
  });
}

export function usePOSSession() {
  return { session: null, start: () => {}, end: () => {} };
}
