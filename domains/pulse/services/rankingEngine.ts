// domains/pulse/services/rankingEngine.ts
// MTAA Pulse — Content Ranking Engine (ported from old rankingEngine.ts)

export interface ContentStats {
  watch_time: number;
  duration: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  completion_rate?: number;
}

export interface RankedScore {
  score: number;
  breakdown: {
    completion: number;
    likes: number;
    shares: number;
    comments: number;
    views: number;
    recency: number;
  };
  tier: 'viral' | 'trending' | 'engaging' | 'standard' | 'low';
}

export const rankingEngine = {
  scoreContent(stats: ContentStats, createdAt?: string): RankedScore {
    const completionRate = stats.duration > 0
      ? Math.min(stats.watch_time / stats.duration, 1)
      : 0;

    let score = 0;
    score += completionRate * 50;
    score += (stats.likes || 0) * 10;
    score += (stats.shares || 0) * 20;
    score += (stats.comments || 0) * 15;
    score += (stats.views || 0) * 0.05;

    let recencyBoost = 0;
    if (createdAt) {
      const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursOld < 1) recencyBoost = 25;
      else if (hoursOld < 6) recencyBoost = 15;
      else if (hoursOld < 24) recencyBoost = 10;
      else if (hoursOld < 72) recencyBoost = 5;
    }
    score += recencyBoost;

    let tier: RankedScore['tier'] = 'low';
    if (score >= 200) tier = 'viral';
    else if (score >= 100) tier = 'trending';
    else if (score >= 50) tier = 'engaging';
    else if (score >= 20) tier = 'standard';

    return {
      score: Math.round(score * 100) / 100,
      breakdown: {
        completion: Math.round(completionRate * 50 * 100) / 100,
        likes: (stats.likes || 0) * 10,
        shares: (stats.shares || 0) * 20,
        comments: (stats.comments || 0) * 15,
        views: (stats.views || 0) * 0.05,
        recency: recencyBoost,
      },
      tier,
    };
  },

  isTrending(stats: ContentStats): boolean {
    return (stats.views > 1000 && stats.shares > 50) ||
           (stats.likes > 500 && stats.comments > 100);
  },

  isViral(stats: ContentStats): boolean {
    return stats.views > 10000 && stats.shares > 500 && stats.likes > 2000;
  },

  calculateVelocity(currentStats: ContentStats, previousStats: ContentStats, hoursDelta: number): number {
    if (hoursDelta <= 0) return 0;
    const currentScore = this.scoreContent(currentStats).score;
    const previousScore = this.scoreContent(previousStats).score;
    return (currentScore - previousScore) / hoursDelta;
  },
};
