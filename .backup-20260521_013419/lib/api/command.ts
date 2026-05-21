import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCommandAPI() {
  const queryClient = useQueryClient();

  return {
    useAnalytics: () =>
      useQuery({
        queryKey: ['command', 'analytics'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('analytics_summary')
            .select('*')
            .single();
          if (error) throw error;
          return data;
        },
      }),

    useUsers: () =>
      useQuery({
        queryKey: ['command', 'users'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, phone, status, created_at')
            .order('created_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          return data;
        },
      }),

    useAllTransactions: () =>
      useQuery({
        queryKey: ['command', 'transactions'],
        queryFn: async () => {
          const { data, error } = await supabase
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);
          if (error) throw error;
          return data;
        },
      }),

    useFraudAlerts: () => {
      const { data, isLoading } = useQuery({
        queryKey: ['command', 'fraud-alerts'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('fraud_alerts')
            .select('*')
            .eq('status', 'open')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
        },
      });

      const resolveAlert = useMutation({
        mutationFn: async (alertId: string) => {
          const { data, error } = await supabase.functions.invoke('resolve-fraud-alert', { body: { alert_id: alertId } });
          if (error) throw error;
          return data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['command', 'fraud-alerts'] });
        },
      }).mutateAsync;

      return { alerts: data, loading: isLoading, resolveAlert };
    },
  };
}
