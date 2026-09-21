// @ts-nocheck
/**
 * MTAA OS — Kamos Trade Intelligence Engine
 * Adapted from Kamos Trade Intelligence v2 for React Native.
 * Core Principle: 1×1 = 1 + f(growth, replication, interaction, observation)
 */

export interface KamosFactor {
  name: string;
  value: number;
  weight: number;
  confidence: number;
  source: string;
}

export interface TradeDNA {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  kamosScore: number;
  factors: KamosFactor[];
  outcome: 'win' | 'loss' | 'open';
  pnl: number;
  pnlPercent: number;
  duration: number;
  lessons: string[];
  dna: string;
  replicatedFrom?: string;
  replicationCount: number;
  timestamp: number;
}

export class KamosIntelligence {
  private tradeMemory: TradeDNA[] = [];
  private maxMemory = 100;

  // The core Kamos formula: 1×1 = 1 + f(growth, replication, interaction, observation)
  static calculateKamosScore(factors: KamosFactor[]): {
    score: number; growth: number; replication: number; interaction: number; observation: number; confidence: number;
  } {
    const base = 1;
    const growth = this.calcDimension(factors, ['momentum', 'volume', 'trend_strength', 'volatility_expansion']);
    const replication = this.calcDimension(factors, ['pattern_match', 'historical_success', 'dna_similarity']);
    const interaction = this.calcDimension(factors, ['correlation', 'funding_rate', 'open_interest', 'order_flow']);
    const observation = this.calcDimension(factors, ['price_action', 'sentiment', 'macro_context', 'web_intelligence']);

    const f = (growth * 0.3) + (replication * 0.25) + (interaction * 0.25) + (observation * 0.2);
    const score = Math.min(100, Math.max(0, base + f * (1 + growth * 0.01) * (1 + replication * 0.01)));
    
    const confidences = factors.map(f => f.confidence);
    const confidence = confidences.length > 0 ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length : 0.5;

    return {
      score: Math.round(score),
      growth: Math.round(growth),
      replication: Math.round(replication),
      interaction: Math.round(interaction),
      observation: Math.round(observation),
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  private static calcDimension(factors: KamosFactor[], names: string[]): number {
    const relevant = factors.filter(f => names.includes(f.name));
    const weightSum = relevant.reduce((sum, f) => sum + f.weight, 0) || 1;
    return relevant.reduce((sum, f) => sum + (f.value * f.weight * f.confidence), 0) / weightSum;
  }

  static generateDNA(factors: KamosFactor[], context: any): string {
    const sortedFactors = [...factors].sort((a, b) => a.name.localeCompare(b.name));
    const factorHash = sortedFactors.map(f => `${f.name}:${Math.round(f.value / 10)}`).join('|');
    const contextHash = `${context.fundingRate > 0 ? 'pos' : 'neg'}_${Math.round((context.fearGreed || 50) / 20)}`;
    // Simple hash simulation
    return btoa(factorHash + '::' + contextHash).slice(0, 16);
  }

  learn(trade: TradeDNA): void {
    this.tradeMemory.unshift(trade);
    if (this.tradeMemory.length > this.maxMemory) {
      this.tradeMemory = this.tradeMemory.slice(0, this.maxMemory);
    }
  }

  getWisdom(): {
    totalTrades: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    currentBias: 'bullish' | 'bearish' | 'neutral';
    topLessons: string[];
    bestDNA: TradeDNA | null;
    worstDNA: TradeDNA | null;
  } {
    const completed = this.tradeMemory.filter(t => t.outcome !== 'open');
    const wins = completed.filter(t => t.outcome === 'win');
    const losses = completed.filter(t => t.outcome === 'loss');

    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnlPercent, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + t.pnlPercent, 0) / losses.length : 0;

    const recent = completed.slice(0, 20);
    const longWins = recent.filter(t => t.direction === 'LONG' && t.outcome === 'win').length;
    const shortWins = recent.filter(t => t.direction === 'SHORT' && t.outcome === 'win').length;
    const currentBias = longWins > shortWins + 3 ? 'bullish' : shortWins > longWins + 3 ? 'bearish' : 'neutral';

    const bestDNA = completed.length > 0 ? completed.reduce((best, t) => t.pnlPercent > best.pnlPercent ? t : best, completed[0]) : null;
    const worstDNA = completed.length > 0 ? completed.reduce((worst, t) => t.pnlPercent < worst.pnlPercent ? t : worst, completed[0]) : null;

    return {
      totalTrades: completed.length,
      winRate: completed.length > 0 ? (wins.length / completed.length) * 100 : 0,
      avgWin,
      avgLoss,
      currentBias,
      topLessons: ['Always respect stop loss', 'Trade with the trend', 'Manage position size'],
      bestDNA,
      worstDNA,
    };
  }
}

export const kamosIntelligence = new KamosIntelligence();

// Helper: Calculate factors from mock/live data
export function calculateFactorsFromData(klines: any[], futuresData: any, fearGreed: any, correlations: any[]): KamosFactor[] {
  if (klines.length < 50) return [];
  const closes = klines.map((k: any) => k.close);
  const volumes = klines.map((k: any) => k.volume);
  
  // Momentum (RSI-based simulation)
  const rsi = 50; // Placeholder for actual RSI calc
  const momentumValue = rsi > 70 ? 30 : rsi < 30 ? 70 : 50 + (50 - rsi);

  // Volume
  const avgVol = volumes.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
  const lastVol = volumes[volumes.length - 1];
  const volRatio = avgVol === 0 ? 1 : lastVol / avgVol;
  const volumeValue = Math.min(100, volRatio * 60);

  return [
    { name: 'momentum', value: Math.round(momentumValue), weight: 1.0, confidence: 0.85, source: 'technical' },
    { name: 'volume', value: Math.round(volumeValue), weight: 0.9, confidence: 0.9, source: 'technical' },
    { name: 'pattern_match', value: 60, weight: 0.8, confidence: 0.7, source: 'memory' },
    { name: 'sentiment', value: fearGreed?.value || 50, weight: 0.7, confidence: 0.65, source: 'sentiment' },
    { name: 'funding_rate', value: futuresData?.fundingRate ? 50 : 50, weight: 0.8, confidence: 0.75, source: 'futures' },
  ];
}
