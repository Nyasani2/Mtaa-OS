import { useQuery } from "@tanstack/react-query";

export function useMarketplaceSearch(query: string) {
  return useQuery({
    queryKey: ["marketplace", query],
    queryFn: async () => [],
  });
}

export function useShopMessages() {
  return { messages: [], send: () => {} };
}
