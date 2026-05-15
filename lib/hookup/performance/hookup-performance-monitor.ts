export function measureLatency(
  start: number
) {

  const duration =
    Date.now() - start;

  return {
    latency_ms: duration,
    status:
      duration < 200
        ? "FAST"
        : duration < 800
        ? "ACCEPTABLE"
        : "SLOW",
  };
}
