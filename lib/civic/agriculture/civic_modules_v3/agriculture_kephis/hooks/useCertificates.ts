"use client";

import { useEffect } from "react";
import { useAgriculture } from "../controllers/useAgriculture";
import { useAuth } from "@/hooks/useAuth";

export function useCertificates() {
  const { user } = useAuth();
  const agri = useAgriculture();

  useEffect(() => {
    if (user?.id) {
      agri.loadCertificates(user.id);
    }
  }, [user?.id]);

  return {
    certificates: agri.certificates,
    isLoading: agri.isLoading,
    error: agri.error,
    selectedCertificate: agri.selectedItem,
    setSelectedCertificate: agri.setSelectedItem,
    refresh: () => user?.id && agri.loadCertificates(user.id),
  };
}
