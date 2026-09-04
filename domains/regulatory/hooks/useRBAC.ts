"use client";

import { useState, useEffect, useCallback } from 'react';
import { rbacService, type FinancialRole, type UserWithRoles } from "../services/rbacService";

export function useFinancialRoles() {
  const [roles, setRoles] = useState<FinancialRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await rbacService.getRoles();
      if (result.error) throw new Error(result.error);
      setRoles(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, loading, error, refetch: fetchRoles };
}

export function useUserRoles(userId: string) {
  const [userRoles, setUserRoles] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRoles = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await rbacService.getUserRoles(userId);
      setUserRoles(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  return { userRoles, loading, error, refetch: fetchUserRoles };
}

export function usePermissionCheck(userId: string, permission: string) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !permission) return;
    setLoading(true);
    rbacService.hasPermission(userId, permission)
      .then(setHasPermission)
      .finally(() => setLoading(false));
  }, [userId, permission]);

  return { hasPermission, loading };
}
