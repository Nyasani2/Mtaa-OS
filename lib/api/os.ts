import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useInstalledApps() {
  return useQuery({
    queryKey: ['os', 'installed-apps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('installed_apps')
        .select('*, apps(*)')
        .order('installed_at', { ascending: false });
      if (error) throw error;
      return data?.map((item: any) => ({
        id: item.apps.id,
        name: item.apps.name,
        icon: item.apps.icon,
        route: item.apps.deep_link,
        color: item.apps.color,
      })) || [];
    },
  });
}

export function useAvailableApps() {
  const queryClient = useQueryClient();

  const apps = useQuery({
    queryKey: ['os', 'available-apps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .eq('published', true);
      if (error) throw error;
      return data;
    },
  });

  const installApp = useMutation({
    mutationFn: async (appId: string) => {
      const { data, error } = await supabase.functions.invoke('install-app', { body: { app_id: appId } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os', 'installed-apps'] });
    },
  }).mutateAsync;

  return { ...apps, installApp };
}
