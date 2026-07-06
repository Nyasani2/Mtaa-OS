import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PaginatedQueryOptions<T> {
  queryKey: string[];
  queryFn: (params: { page: number; pageSize: number }) => Promise<{ data: T[]; count: number | null }>;
  pageSize?: number;
}

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  pageSize = 20,
}: PaginatedQueryOptions<T>) {
  const [page, setPage] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKey, page, pageSize],
    queryFn: () => queryFn({ page, pageSize }),
  });

  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNext = page < totalPages - 1;
  const hasPrev = page > 0;

  const nextPage = () => {
    if (hasNext) setPage((p) => p + 1);
  };

  const prevPage = () => {
    if (hasPrev) setPage((p) => p - 1);
  };

  return {
    data: data?.data ?? [],
    isLoading,
    error,
    refetch,
    page: page + 1,
    totalPages: totalPages || 1,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    pageSize,
  };
}
