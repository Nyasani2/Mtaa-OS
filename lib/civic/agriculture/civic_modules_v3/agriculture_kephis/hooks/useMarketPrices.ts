"use client";

import { useEffect } from "react";
import { useAgriculture } from "../controllers/useAgriculture";

export function useMarketPrices(commodity?: string, county?: string) {
  const agri = useAgriculture();

  useEffect(() => {
    agri.loadMarketPrices(commodity, county);
  }, [commodity, county]);

  return {
    marketPrices: agri.marketPrices,
    isLoading: agri.isLoading,
    error: agri.error,
    refresh: () => agri.loadMarketPrices(commodity, county),
  };
}
