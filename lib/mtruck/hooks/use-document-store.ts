import { create } from "zustand";
import type { TruckDocument } from "@/lib/mtruck/types";

interface DocumentState {
  documents: TruckDocument[];
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [
    { id: "d1", type: "manifest", name: "Load Manifest #2847", url: "#", uploadedAt: "2026-05-18" },
    { id: "d2", type: "permit", name: "Cross-Border Permit", url: "#", uploadedAt: "2026-05-15", expiryDate: "2026-08-15" },
    { id: "d3", type: "invoice", name: "Freight Invoice #1024", url: "#", uploadedAt: "2026-05-12" },
  ],
}));
