"use client";

import { useEffect } from "react";
import { useTransport } from "../controllers/useTransport";
import { useAuth } from "@/hooks/useAuth";

export function useVehicles() {
  const { user } = useAuth();
  const transport = useTransport();

  useEffect(() => {
    if (user?.id) {
      transport.loadVehicles(user.id);
    }
  }, [user?.id]);

  return {
    vehicles: transport.vehicles,
    isLoading: transport.isLoading,
    error: transport.error,
    selectedVehicle: transport.selectedItem,
    setSelectedVehicle: transport.setSelectedItem,
    registerVehicle: transport.registerVehicle,
    refresh: () => user?.id && transport.loadVehicles(user.id),
  };
}
