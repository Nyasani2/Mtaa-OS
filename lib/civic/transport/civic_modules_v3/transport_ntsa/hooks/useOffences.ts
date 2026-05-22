"use client";

import { useEffect } from "react";
import { useTransport } from "../controllers/useTransport";
import { useAuth } from "@/hooks/useAuth";

export function useOffences() {
  const { user } = useAuth();
  const transport = useTransport();

  useEffect(() => {
    if (user?.id) {
      transport.loadOffences(user.id);
    }
  }, [user?.id]);

  return {
    offences: transport.offences,
    isLoading: transport.isLoading,
    error: transport.error,
    payFine: transport.payFine,
    refresh: () => user?.id && transport.loadOffences(user.id),
  };
}
