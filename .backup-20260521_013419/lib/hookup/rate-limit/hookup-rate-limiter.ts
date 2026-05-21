const userBuckets: Record<string, number> = {};

export function rateLimit(
  user_id: string,
  limit: number = 60
) {

  const now = Date.now();

  if (!userBuckets[user_id]) {
    userBuckets[user_id] = now;
  }

  const diff =
    (now - userBuckets[user_id]) / 1000;

  if (diff < limit) {
    return {
      allowed: false,
      retry_after: limit - diff,
    };
  }

  userBuckets[user_id] = now;

  return { allowed: true };
}
