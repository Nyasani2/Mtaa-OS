/**
 * ASIS v4 Wallet Intelligence
 * Fraud detection, transfer routing, transaction validation — no API calls
 */

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  timestamp: number;
  type: 'send' | 'receive' | 'swap' | 'stake';
  status: 'pending' | 'confirmed' | 'failed';
}

export interface FraudSignal {
  level: 'none' | 'low' | 'medium' | 'high';
  reasons: string[];
  score: number; // 0-1
}

export interface TransferRoute {
  path: string[]; // intermediary addresses
  estimatedFee: number;
  estimatedTime: number; // seconds
  confidence: number;
}

export class WalletIntelligence {
  private transactionHistory: Transaction[] = [];
  private fraudPatterns: Map<string, number> = new Map(); // pattern -> frequency
  private trustedAddresses: Set<string> = new Set();
  private blockedAddresses: Set<string> = new Set();
  private maxHistory = 1000;

  constructor() {
    // Seed common fraud patterns
    this.fraudPatterns.set('rapid_small_transactions', 0);
    this.fraudPatterns.set('round_amounts', 0);
    this.fraudPatterns.set('new_address_large_transfer', 0);
    this.fraudPatterns.set('off_hours_activity', 0);
  }

  analyzeTransaction(tx: Omit<Transaction, 'id'>): FraudSignal {
    const reasons: string[] = [];
    let score = 0;

    // Pattern 1: Rapid small transactions (potential dusting)
    const recentFromSame = this.transactionHistory.filter(
      t => t.from === tx.from && t.timestamp > Date.now() - 3600000
    );
    if (recentFromSame.length > 10) {
      score += 0.3;
      reasons.push('Rapid transactions from same address (dusting attack?)');
      this.fraudPatterns.set('rapid_small_transactions', (this.fraudPatterns.get('rapid_small_transactions') || 0) + 1);
    }

    // Pattern 2: Round amounts (common in scams)
    if (tx.amount === Math.round(tx.amount) && tx.amount > 100) {
      score += 0.1;
      reasons.push('Round amount transfer — verify recipient');
      this.fraudPatterns.set('round_amounts', (this.fraudPatterns.get('round_amounts') || 0) + 1);
    }

    // Pattern 3: New address, large transfer
    const knownTo = this.transactionHistory.some(t => t.to === tx.to);
    if (!knownTo && tx.amount > 1000) {
      score += 0.25;
      reasons.push('Large transfer to new/unseen address');
      this.fraudPatterns.set('new_address_large_transfer', (this.fraudPatterns.get('new_address_large_transfer') || 0) + 1);
    }

    // Pattern 4: Off-hours (simplified: check if weekend or late night)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      score += 0.05;
      reasons.push('Unusual hour for transaction');
      this.fraudPatterns.set('off_hours_activity', (this.fraudPatterns.get('off_hours_activity') || 0) + 1);
    }

    // Pattern 5: Blocked address
    if (this.blockedAddresses.has(tx.to) || this.blockedAddresses.has(tx.from)) {
      score += 0.5;
      reasons.push('Address is in blocked list');
    }

    // Pattern 6: Trusted address reduces score
    if (this.trustedAddresses.has(tx.to)) {
      score = Math.max(0, score - 0.2);
      reasons.push('Recipient is in trusted list');
    }

    // Normalize
    score = Math.min(1, score);

    let level: FraudSignal['level'] = 'none';
    if (score > 0.7) level = 'high';
    else if (score > 0.4) level = 'medium';
    else if (score > 0.1) level = 'low';

    return { level, reasons, score };
  }

  recordTransaction(tx: Transaction) {
    this.transactionHistory.push(tx);
    if (this.transactionHistory.length > this.maxHistory) {
      this.transactionHistory.shift();
    }
  }

  findTransferRoute(from: string, to: string, amount: number): TransferRoute {
    // Simplified routing: direct if trusted, otherwise suggest verification
    const direct: TransferRoute = {
      path: [from, to],
      estimatedFee: amount * 0.001, // 0.1% fee estimate
      estimatedTime: this.trustedAddresses.has(to) ? 5 : 30, // seconds
      confidence: this.trustedAddresses.has(to) ? 0.95 : 0.7,
    };

    // If high fraud risk, suggest longer path with escrow
    const fraudCheck = this.analyzeTransaction({ from, to, amount, currency: 'USD', timestamp: Date.now(), type: 'send', status: 'pending' });
    if (fraudCheck.level === 'high') {
      return {
        path: [from, 'escrow', to],
        estimatedFee: amount * 0.005,
        estimatedTime: 300, // 5 min with escrow
        confidence: 0.4,
      };
    }

    return direct;
  }

  addTrustedAddress(address: string) {
    this.trustedAddresses.add(address);
    this.blockedAddresses.delete(address);
  }

  addBlockedAddress(address: string) {
    this.blockedAddresses.add(address);
    this.trustedAddresses.delete(address);
  }

  getFraudStats() {
    const stats: Record<string, number> = {};
    const entries = Array.from(this.fraudPatterns.entries());
    for (let i = 0; i < entries.length; i++) {
      stats[entries[i][0]] = entries[i][1];
    }
    return {
      totalTransactions: this.transactionHistory.length,
      fraudPatterns: stats,
      trustedCount: this.trustedAddresses.size,
      blockedCount: this.blockedAddresses.size,
    };
  }

  getTransactionHistory(limit: number = 50): Transaction[] {
    return this.transactionHistory.slice(-limit);
  }
}

export const walletIntelligence = new WalletIntelligence();
