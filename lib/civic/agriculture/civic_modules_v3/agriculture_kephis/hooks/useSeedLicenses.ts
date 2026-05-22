"use client";

import { useEffect } from "react";
import { useAgriculture } from "../controllers/useAgriculture";
import { useAuth } from "@/hooks/useAuth";

export function useSeedLicenses() {
  const { user } = useAuth();
  const agri = useAgriculture();

  useEffect(() => {
    if (user?.id) {
      agri.loadSeedLicenses(user.id);
    }
  }, [user?.id]);

  return {
    seedLicenses: agri.seedLicenses,
    isLoading: agri.isLoading,
    error: agri.error,
    refresh: () => user?.id && agri.loadSeedLicenses(user.id),
  };
}
