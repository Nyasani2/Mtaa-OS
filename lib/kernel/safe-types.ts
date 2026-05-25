// lib/kernel/safe-types.ts
export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

export function safeObject<T extends Record<string, unknown>>(value: unknown): T;
export function safeObject<T extends Record<string, unknown>>(value: unknown, defaultValue: T): T;
export function safeObject<T extends Record<string, unknown>>(value: unknown, defaultValue?: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as T;
  return defaultValue ?? ({} as T);
}

export function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  return String(value ?? '');
}

export function safeNumber(value: unknown): number {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

export function safeBoolean(value: unknown): boolean {
  return !!value;
}
