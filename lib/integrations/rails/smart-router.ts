import { railMonitor } from '../monitoring/rail-status';
import { railRegistry } from './rail-registry';

export function chooseBestRail(amount: number, currencyFrom: string, currencyTo: string) {
  const rails = railRegistry.list();

  const ranked = rails.map(r => {
    const health = railMonitor.get(r.name);

    const score =
      (health?.status === 'online' ? 1 : 0) * 0.5 +
      (1 / (health?.latency_ms || 1000)) * 0.3 +
      (r.country === currencyTo ? 0.2 : 0);

    return { rail: r, score };
  });

  ranked.sort((a, b) => b.score - a.score);

  return ranked[0]?.rail || null;
}
