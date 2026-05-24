/**
 * ASIS Layer 6 — Route Optimizer
 * Shortest, cheapest, safest, best liquidity, cross-border optimization
 * ASIS explains: "Nearest available withdrawal is 0.8 km away."
 */

import { WithdrawalRoute, RoutePriority, CashPoint, OperationalState } from './types';
import { CashPointEngine } from './cash-point-engine';
import { LiquidityManager } from './liquidity-manager';
import { GeoDiscovery, DiscoveryResult } from './geo-discovery';

export class RouteOptimizer {
  private engine: CashPointEngine;
  private liquidity: LiquidityManager;
  private discovery: GeoDiscovery;

  constructor(engine: CashPointEngine, liquidity: LiquidityManager, discovery: GeoDiscovery) {
    this.engine = engine;
    this.liquidity = liquidity;
    this.discovery = discovery;
  }

  /**
   * Find optimal withdrawal routes
   */
  async findRoutes(
    lat: number,
    lng: number,
    amount: number,
    currency: string,
    priority: RoutePriority = RoutePriority.NEAREST,
    limit: number = 5
  ): Promise<WithdrawalRoute[]> {
    // Discover nearby
    const nearby = await this.discovery.discover(lat, lng, {
      radiusKm: 10,
      limit: 50,
      filters: {
        currencies: [currency],
        operationalState: [OperationalState.ONLINE, OperationalState.LOW_LIQUIDITY],
        minRating: 3.0,
      },
    });

    // Score each route
    const scored = await Promise.all(
      nearby.map(async (result) => {
        const liquidityCheck = await this.liquidity.canFulfill(result.cashPoint.id, currency, amount);
        const score = this.calculateScore(result, liquidityCheck.canFulfill, priority);

        return {
          id: `route_${result.cashPoint.id}_${Date.now()}`,
          cashPointId: result.cashPoint.id,
          cashPointName: result.cashPoint.name,
          distanceKm: result.distanceKm,
          estimatedTimeMinutes: result.estimatedWalkMinutes,
          fee: result.cashPoint.fees.withdrawal || 0,
          currency,
          availableLiquidity: liquidityCheck.snapshot?.available || 0,
          routeConfidence: liquidityCheck.canFulfill ? score : score * 0.3,
          routeType: priority,
          warnings: this.generateWarnings(result, liquidityCheck),
          recommended: false,
          score,
        };
      })
    );

    // Sort by priority
    scored.sort((a, b) => b.score - a.score);

    // Mark top as recommended
    if (scored.length > 0) {
      scored[0].recommended = true;
    }

    return scored.slice(0, limit).map(({ score, ...route }) => route);
  }

  /**
   * Explain route recommendation to user
   */
  explainRoute(route: WithdrawalRoute): string {
    const parts: string[] = [];

    parts.push(`${route.cashPointName} is ${route.distanceKm.toFixed(1)} km away.`);

    if (route.estimatedTimeMinutes <= 15) {
      parts.push(`About ${route.estimatedTimeMinutes} minutes walk.`);
    } else {
      parts.push(`About ${Math.ceil(route.estimatedTimeMinutes / 5)} minutes by boda or taxi.`);
    }

    if (route.fee > 0) {
      parts.push(`Fee: ${route.fee} ${route.currency}.`);
    } else {
      parts.push('No withdrawal fee.');
    }

    if (route.warnings.length > 0) {
      parts.push(`Note: ${route.warnings[0]}`);
    }

    if (route.recommended) {
      parts.push('This is our top recommendation for you.');
    }

    return parts.join(' ');
  }

  /**
   * Compare multiple route options
   */
  async compareRoutes(
    lat: number,
    lng: number,
    amount: number,
    currency: string
  ): Promise<Array<{ priority: RoutePriority; routes: WithdrawalRoute[]; summary: string }>> {
    const priorities = [
      RoutePriority.NEAREST,
      RoutePriority.CHEAPEST,
      RoutePriority.BEST_LIQUIDITY,
      RoutePriority.SAFEST,
    ];

    const comparisons = [];

    for (const priority of priorities) {
      const routes = await this.findRoutes(lat, lng, amount, currency, priority, 3);
      const summary = this.summarizeComparison(routes, priority);
      comparisons.push({ priority, routes, summary });
    }

    return comparisons;
  }

  private calculateScore(result: DiscoveryResult, canFulfill: boolean, priority: RoutePriority): number {
    let score = 0;

    switch (priority) {
      case RoutePriority.NEAREST:
        score = Math.max(0, 100 - result.distanceKm * 20);
        break;
      case RoutePriority.CHEAPEST:
        score = Math.max(0, 100 - (result.cashPoint.fees.withdrawal || 0));
        break;
      case RoutePriority.BEST_LIQUIDITY:
        const liquidity = result.cashPoint.liquidity[Object.keys(result.cashPoint.liquidity)[0]] || 0;
        score = Math.min(100, liquidity / 1000);
        break;
      case RoutePriority.SAFEST:
        score = result.cashPoint.rating * 20;
        if (result.cashPoint.verified) score += 20;
        break;
      case RoutePriority.FASTEST:
        score = Math.max(0, 100 - result.estimatedWalkMinutes);
        break;
    }

    // Penalize if can't fulfill
    if (!canFulfill) score *= 0.2;

    // Bonus for open now
    if (result.isOpenNow) score += 10;

    // Bonus for high rating
    score += (result.cashPoint.rating - 3) * 5;

    return score;
  }

  private generateWarnings(result: DiscoveryResult, liquidityCheck: { canFulfill: boolean; shortfall: number }): string[] {
    const warnings: string[] = [];

    if (!liquidityCheck.canFulfill) {
      warnings.push(`May not have enough cash (shortfall: ${liquidityCheck.shortfall})`);
    }

    if (result.cashPoint.status === 'low_liquidity') {
      warnings.push('Low liquidity — call ahead to confirm');
    }

    if (!result.isOpenNow) {
      warnings.push('Currently closed');
    } else if (result.closesInMinutes && result.closesInMinutes < 60) {
      warnings.push(`Closes in ${result.closesInMinutes} minutes`);
    }

    if (result.cashPoint.rating < 3.5) {
      warnings.push('Lower rated agent');
    }

    return warnings;
  }

  private summarizeComparison(routes: WithdrawalRoute[], priority: RoutePriority): string {
    if (routes.length === 0) return `No ${priority} routes available.`;

    const best = routes[0];
    const summaries: Record<RoutePriority, string> = {
      nearest: `Closest option: ${best.cashPointName} (${best.distanceKm.toFixed(1)} km)`,
      cheapest: `Lowest fee: ${best.cashPointName} (${best.fee} ${best.currency})`,
      safest: `Most trusted: ${best.cashPointName} (verified agent)`,
      best_liquidity: `Best stocked: ${best.cashPointName}`,
      fastest: `Quickest: ${best.cashPointName} (${best.estimatedTimeMinutes} min)`,
    };

    return summaries[priority] || `Best ${priority} option: ${best.cashPointName}`;
  }
}
