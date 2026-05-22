"use client";

import { useEffect } from "react";
import { useTransport } from "../controllers/useTransport";
import { useAuth } from "@/hooks/useAuth";

export function useLicenses() {
  const { user } = useAuth();
  const transport = useTransport();

  useEffect(() => {
    if (user?.id) {
      transport.loadLicenses(user.id);
    }
  }, [user?.id]);

  return {
    licenses: transport.licenses,
    isLoading: transport.isLoading,
    error: transport.error,
    selectedLicense: transport.selectedItem,
    setSelectedLicense: transport.setSelectedItem,
    refresh: () => user?.id && transport.loadLicenses(user.id),
  };
}
