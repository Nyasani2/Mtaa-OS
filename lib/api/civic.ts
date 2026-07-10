import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCivicAPI() {
  return {
    useIdentity: () =>
      useQuery({
        queryKey: ['civic', 'identity'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('user_identities')
            .select('*')
            .single();
          if (error) throw error;
          return data;
        },
      }),

    useTaxData: () =>
      useQuery({
        queryKey: ['civic', 'tax'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('tax_statements')
            .select('*')
            .order('period', { ascending: false });
          if (error) throw error;
          return { statements: data, total_paid: data?.reduce((sum: number, s: any) => sum + (s.amount || 0), 0) || 0 };
        },
      }),

    usePayrollData: () =>
      useQuery({
        queryKey: ['civic', 'payroll'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('payslips')
            .select('*')
            .order('period', { ascending: false });
          if (error) throw error;
          return { payslips: data, gross_pay: 0, net_pay: 0, deductions: 0 };
        },
      }),

    useAuditLogs: () =>
      useQuery({
        queryKey: ['civic', 'audit'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          return data;
        },
      }),

    useElections: () =>
      useQuery({
        queryKey: ['civic', 'elections'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('elections')
            .select('*')
            .eq('status', 'active');
          if (error) throw error;
          return data;
        },
      }),
  };
}
