/**
 * ASIS Layer 6 — Cash Point Network Interfaces
 * Provider abstractions for future integrations
 */

import {
  CashPoint,
  GeoLocation,
  LiquiditySnapshot,
  WithdrawalRoute,
  CountryProfile,
  CrossBorderRoute,
  SettlementBatch,
  OfflineTransaction,
  RegionGroup,
  OperationalState,
  RoutePriority,
  AgentVerification,
} from './types';

/**
 * Geo Discovery Provider — geospatial cash point lookup
 */
export interface IGeoDiscoveryProvider {
  name: string;

  /** Find cash points near coordinates */
  findNearby(lat: number, lng: number, radiusKm: number, filters?: GeoFilters): Promise<CashPoint[]>;

  /** Find cash points by geohash */
  findByGeohash(geohash: string, precision: number): Promise<CashPoint[]>;

  /** Get cash point by ID */
  getById(id: string): Promise<CashPoint | null>;

  /** Search by name or address */
  search(query: string, country?: string): Promise<CashPoint[]>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

export interface GeoFilters {
  currencies?: string[];
  types?: string[];
  minRating?: number;
  requireVerified?: boolean;
  operationalState?: OperationalState[];
  maxFee?: number;
  languages?: string[];
}

/**
 * Liquidity Provider — float management abstraction
 */
export interface ILiquidityProvider {
  name: string;

  /** Get current liquidity snapshot */
  getLiquidity(cashPointId: string, currency: string): Promise<LiquiditySnapshot>;

  /** Reserve liquidity for withdrawal */
  reserve(cashPointId: string, currency: string, amount: number, ttlMinutes: number): Promise<boolean>;

  /** Release reservation */
  release(cashPointId: string, currency: string, amount: number): Promise<void>;

  /** Update liquidity (from agent report) */
  update(cashPointId: string, currency: string, amount: number): Promise<void>;

  /** Get health score for cash point */
  getHealthScore(cashPointId: string): Promise<number>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

/**
 * Settlement Provider — reconciliation abstraction
 */
export interface ISettlementProvider {
  name: string;

  /** Create settlement batch */
  createBatch(transactions: string[], route: string): Promise<SettlementBatch>;

  /** Get batch status */
  getBatchStatus(batchId: string): Promise<SettlementBatch>;

  /** Reconcile batch */
  reconcile(batchId: string): Promise<{ matched: number; unmatched: number; discrepancies: string[] }>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

/**
 * Cross-Border Provider — corridor management
 */
export interface ICrossBorderProvider {
  name: string;

  /** Get available corridors */
  getCorridors(fromCountry: string): Promise<CrossBorderRoute[]>;

  /** Get corridor details */
  getCorridor(fromCountry: string, toCountry: string): Promise<CrossBorderRoute | null>;

  /** Estimate cross-border transfer */
  estimate(fromCountry: string, toCountry: string, amount: number, currency: string): Promise<{
    duration: number;
    fee: number;
    fxRate: number;
    totalReceived: number;
  }>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

/**
 * Offline Sync Provider — intermittent connectivity support
 */
export interface IOfflineSyncProvider {
  name: string;

  /** Queue transaction for sync */
  queue(transaction: OfflineTransaction): Promise<void>;

  /** Get queued transactions */
  getQueued(cashPointId?: string): Promise<OfflineTransaction[]>;

  /** Sync queued transactions */
  sync(): Promise<{ synced: number; failed: number; pending: number }>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

/**
 * Reputation Provider — agent scoring
 */
export interface IReputationProvider {
  name: string;

  /** Get agent reputation */
  getReputation(agentId: string): Promise<ReputationSummary>;

  /** Record transaction outcome */
  recordTransaction(agentId: string, success: boolean, amount: number, currency: string): Promise<void>;

  /** Record customer rating */
  recordRating(agentId: string, userId: string, rating: number, comment?: string): Promise<void>;

  /** Record dispute */
  recordDispute(agentId: string, disputeType: string, resolved: boolean): Promise<void>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

export interface ReputationSummary {
  agentId: string;
  overall: number;
  reliability: number;
  liquidityConsistency: number;
  customerRating: number;
  disputeRate: number;
  fraudFlags: number;
  totalTransactions: number;
  successfulTransactions: number;
  explanation: string;
}
