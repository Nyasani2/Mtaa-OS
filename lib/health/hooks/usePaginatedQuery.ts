import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PaginatedQueryOptions<T> {
  queryKey: string | string[];
  queryFn: (params: { page: number; pageSize: number }) => Promise<T[]>;
  pageSize?: number;
}

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  pageSize = 20,
}: PaginatedQueryOptions<T>) {
  const [page, setPage] = useState(1);

  // Defensive: ensure queryKey is always an array
  const normalizedKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...normalizedKey, page, pageSize],
    queryFn: () => queryFn({ page, pageSize }),
  });

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
    page,
    nextPage,
    prevPage,
    hasMore: (data || []).length === pageSize,
  };
}
