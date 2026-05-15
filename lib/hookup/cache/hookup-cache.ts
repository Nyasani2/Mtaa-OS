const cache: Record<string, any> = {};

export function setCache(
  key: string,
  value: any
) {
  cache[key] = {
    value,
    timestamp: Date.now(),
  };
}

export function getCache(key: string) {

  const item = cache[key];

  if (!item) return null;

  const expired =
    Date.now() - item.timestamp > 60000;

  if (expired) {
    delete cache[key];
    return null;
  }

  return item.value;
}
