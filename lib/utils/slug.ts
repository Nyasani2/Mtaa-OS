export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}
