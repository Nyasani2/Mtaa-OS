"use client";

import { useEffect } from "react";
import { useAgriculture } from "../controllers/useAgriculture";

export function usePestReports(county?: string) {
  const agri = useAgriculture();

  useEffect(() => {
    agri.loadPestReports(county);
  }, [county]);

  return {
    pestReports: agri.pestReports,
    isLoading: agri.isLoading,
    error: agri.error,
    reportPestDisease: agri.reportPestDisease,
    refresh: () => agri.loadPestReports(county),
  };
}
