/**
 * ASIS v4 Memory Engine
 * Conversation history, trade outcomes, learning storage
 */

export interface ConversationMemory {
  role: 'user' | 'asis';
  text: string;
  timestamp: number;
  module: string;
}

export interface TradeOutcome {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  timestamp: number;
  strategy: string;
  notes: string;
}

export interface LearnedFact {
  id: string;
  fact: string;
  source: string;
  confidence: number;
  timestamp: number;
  validated: boolean;
}

export class MemoryEngine {
  private sessions: Map<string, ConversationMemory[]> = new Map();
  private trades: TradeOutcome[] = [];
  private facts: LearnedFact[] = [];
  private maxSessionSize = 100;

  addConversation(sessionId: string, role: 'user' | 'asis', text: string, module: string = 'general') {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    const session = this.sessions.get(sessionId)!;
    session.push({ role, text, timestamp: Date.now(), module });
    if (session.length > this.maxSessionSize) {
      session.shift();
    }
  }

  getRecent(sessionId: string, count: number = 10): ConversationMemory[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return session.slice(-count);
  }

  getAllSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  addTrade(outcome: Omit<TradeOutcome, 'id'>) {
    const trade: TradeOutcome = {
      ...outcome,
      id: `trade-${Date.now()}`,
    };
    this.trades.push(trade);
    // Keep last 1000 trades
    if (this.trades.length > 1000) {
      this.trades.shift();
    }
  }

  getTrades(symbol?: string, limit: number = 50): TradeOutcome[] {
    let result = this.trades;
    if (symbol) {
      result = result.filter(t => t.symbol === symbol);
    }
    return result.slice(-limit);
  }

  getTradeStats(symbol?: string) {
    const trades = symbol ? this.trades.filter(t => t.symbol === symbol) : this.trades;
    if (trades.length === 0) return { total: 0, wins: 0, losses: 0, avgProfit: 0, winRate: 0 };
    const wins = trades.filter(t => t.profit > 0).length;
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    return {
      total: trades.length,
      wins,
      losses: trades.length - wins,
      avgProfit: totalProfit / trades.length,
      winRate: wins / trades.length,
    };
  }

  addFact(fact: Omit<LearnedFact, 'id' | 'timestamp'>) {
    const learned: LearnedFact = {
      ...fact,
      id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: Date.now(),
    };
    this.facts.push(learned);
  }

  searchFacts(query: string): LearnedFact[] {
    const lower = query.toLowerCase();
    return this.facts
      .filter(f => f.fact.toLowerCase().includes(lower) || f.source.toLowerCase().includes(lower))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  validateFact(factId: string) {
    const fact = this.facts.find(f => f.id === factId);
    if (fact) {
      fact.validated = true;
      fact.confidence = Math.min(1, fact.confidence + 0.1);
    }
  }

  getStats() {
    let totalEntries = 0;
    const vals = Array.from(this.sessions.values());
    for (let i = 0; i < vals.length; i++) totalEntries += vals[i].length;
    return {
      totalEntries,
      sessions: this.sessions.size,
      trades: this.trades.length,
      facts: this.facts.length,
    };
  }

  export(): { sessions: Record<string, ConversationMemory[]>; trades: TradeOutcome[]; facts: LearnedFact[] } {
    const sess: Record<string, ConversationMemory[]> = {};
    const entries = Array.from(this.sessions.entries());
    for (let i = 0; i < entries.length; i++) {
      sess[entries[i][0]] = entries[i][1];
    }
    return { sessions: sess, trades: this.trades, facts: this.facts };
  }

  import(data: { sessions: Record<string, ConversationMemory[]>; trades: TradeOutcome[]; facts: LearnedFact[] }) {
    const entries = Object.entries(data.sessions);
    for (let i = 0; i < entries.length; i++) {
      this.sessions.set(entries[i][0], entries[i][1]);
    }
    this.trades = data.trades;
    this.facts = data.facts;
  }
}

export const memoryEngine = new MemoryEngine();
