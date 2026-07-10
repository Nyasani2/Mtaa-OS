import { create } from "zustand";
import type { FuelStation } from "@/lib/mtruck/types";

interface FuelState {
  stations: FuelStation[];
  averagePrice: number;
}

export const useFuelStore = create<FuelState>((set) => ({
  stations: [
    { id: "f1", name: "Shell N1", location: { lat: -26.2, lng: 28.0 }, price: 22.45, currency: "ZAR", distance: 2.3, amenities: ["restaurant", "shop", "shower"] },
    { id: "f2", name: "Total Garage", location: { lat: -26.15, lng: 28.05 }, price: 21.89, currency: "ZAR", distance: 5.1, amenities: ["shop", "atm"] },
    { id: "f3", name: "Engen Highway", location: { lat: -26.25, lng: 27.95 }, price: 22.10, currency: "ZAR", distance: 8.7, amenities: ["restaurant", "shower", "wifi"] },
  ],
  averagePrice: 22.15,
}));
