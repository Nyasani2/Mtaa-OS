export type SafeObject<T = any> = T | null | undefined;

export function safeArray<T>(value: any): T[] {
  return Array.isArray(value) ? value : [];
}

export function safeObject<T>(value: any, fallback: T): T {
  return value && typeof value === "object" ? value : fallback;
}

export function safeNumber(value: any, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

export function safeString(value: any, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
