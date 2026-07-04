// lib/utils/service-helpers.ts
// FIXED: handleServiceError now returns ServiceResult<never> instead of Error

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export function handleServiceError(err: unknown): ServiceResult<never> {
  return {
    data: null,
    error: err instanceof Error ? err : new Error(String(err)),
  };
}

export function handleServiceSuccess<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}
