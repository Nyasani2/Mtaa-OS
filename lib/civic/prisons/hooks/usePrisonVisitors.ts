// lib/civic/prisons/hooks/usePrisonVisitors.ts
import { useState, useEffect, useCallback } from "react";
import { PrisonVisitorsService, PrisonVisitor } from "../services/prisonVisitors";

export function usePrisonVisitors(inmateId?: string) {
  const [visitors, setVisitors] = useState<PrisonVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PrisonVisitorsService.getVisitors(inmateId);
      setVisitors(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load visitors");
    } finally {
      setLoading(false);
    }
  }, [inmateId]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  return { visitors, loading, error, refresh: fetchVisitors };
}

export function useTodayVisitors(prisonId?: string) {
  const [visitors, setVisitors] = useState<PrisonVisitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    PrisonVisitorsService.getTodayVisitors(prisonId)
      .then(setVisitors)
      .finally(() => setLoading(false));
  }, [prisonId]);

  return { visitors, loading };
}

export function useVisitorStats(prisonId?: string) {
  const [stats, setStats] = useState<{ total: number; today: number; byStatus: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    PrisonVisitorsService.getVisitorStats(prisonId)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [prisonId]);

  return { stats, loading };
}
