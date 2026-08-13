import { create } from "zustand";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { TruckDocument } from "@/lib/mtruck/types";

interface DocumentState {
  documents: TruckDocument[];
  loading: boolean;
  error: string | null;
  addDocument: (doc: TruckDocument) => void;
  removeDocument: (docId: string) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  loading: false,
  error: null,

  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  removeDocument: (docId) => set((s) => ({ documents: s.documents.filter((d: any) => d.id !== docId) })),
}));

// ── REALTIME HOOK ──
export function useDocumentRealtime(userId?: string) {
  const { addDocument, removeDocument } = useDocumentStore();

  useEffect(() => {
    if (!userId) return;

    const ch = supabase
      .channel(`mtruck:documents:${userId}`, { config: { private: true } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mtruck_customs_clearance' }, (payload) => {
        // Handle customs document updates
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [userId, addDocument, removeDocument]);
}
