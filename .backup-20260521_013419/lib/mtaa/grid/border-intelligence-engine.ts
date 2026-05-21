export async function predictBorderDelay(
  origin: string,
  destination: string
) {

  const baseDelay =
    origin === destination ? 0 : 6;

  const riskMap: Record<string, number> = {
    Kenya: 1,
    Uganda: 2,
    Tanzania: 1.5,
    Rwanda: 1.2,
  };

  const risk =
    (riskMap[origin] || 1) +
    (riskMap[destination] || 1);

  const delay =
    baseDelay * risk;

  return {
    origin,
    destination,
    estimated_delay_hours: delay,
  };
}
