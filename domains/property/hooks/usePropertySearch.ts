// MTAA PROPERTY OS — SEARCH HOOK

import { useState, useCallback, useEffect } from "react";
import { usePropertyStore } from "../state/propertyStore";
import type { PropertySearchFilters } from "../types";

export function usePropertySearch() {
  const [filters, setFilters] = useState<PropertySearchFilters>({});
  const store = usePropertyStore();

  const applyFilters = useCallback(() => {
    store.fetchProperties(filters);
  }, [filters, store.fetchProperties]);

  const clearFilters = useCallback(() => {
    setFilters({});
    store.fetchProperties();
  }, [store.fetchProperties]);

  useEffect(() => {
    store.fetchProperties();
  }, []);

  return {
    filters,
    setFilters,
    applyFilters,
    clearFilters,
    results: store.properties,
    isLoading: store.isLoading,
    error: store.error,
  };
}
