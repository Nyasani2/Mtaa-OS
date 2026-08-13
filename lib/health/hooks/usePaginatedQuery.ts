import { useQuery } from '@tanstack/react-query';
interface PaginatedQueryOptions { enabled?: boolean; staleTime?: number; pageSize?: number; }
export function usePaginatedQuery<T>(queryKey: (string | null | undefined | Record<string, any>)[], queryFn: (range: { from: number; to: number }) => Promise<T[] | { data: T[]; count: number }>, options?: PaginatedQueryOptions) {
  const pageSize = options?.pageSize || 20;
  return useQuery({ queryKey, queryFn: async () => { const range = { from: 0, to: pageSize - 1 }; return queryFn(range); }, enabled: options?.enabled ?? true, staleTime: options?.staleTime ?? 5 * 60 * 1000 });
}
