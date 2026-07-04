// lib/utils/service-helpers.ts
// FIXED: ServiceResult allows null data for error cases

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export function handleServiceError(err: unknown): ServiceResult<null> {
  return {
    data: null,
    error: err instanceof Error ? err : new Error(String(err)),
  };
}

export function handleServiceSuccess<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}
