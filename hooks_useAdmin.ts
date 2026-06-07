import { useState, useEffect } from 'react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
}

interface AdminProfile {
  id: string;
  name: string;
  role: string;
}

export function useAdmin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIsAdmin(false);
    setStats({ totalUsers: 0, activeUsers: 0, totalTransactions: 0 });
    setIsLoading(false);
  }, []);

  return { isAdmin, profile, stats, isLoading };
}

export default useAdmin;
