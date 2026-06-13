/**
 * ASIS Layer 6 — Cash Point Network + Cross-Border Types
 * Distributed liquidity, geo-routing, African financial mesh
 */

export enum CashPointType {
  FIXED_AGENT = 'fixed_agent',
  ROAMING_AGENT = 'roaming_agent',
  SHOP = 'shop',
  KIOSK = 'kiosk',
  SUPERMARKET = 'supermarket',
  BANK_AGENT = 'bank_agent',
  MOBILE_MONEY_AGENT = 'mobile_money_agent',
  COMMUNITY_HUB = 'community_hub',
}

export enum OperationalState {
  ONLINE = 'online',
  OFFLINE = 'offline',
  LOW_LIQUIDITY = 'low_liquidity',
  SUSPENDED = 'suspended',
  MAINTENANCE = 'maintenance',
}

export enum SettlementMode {
  INSTANT = 'instant',
  DELAYED = 'delayed',
  BATCHED = 'batched',
  MANUAL = 'manual',
}

export enum RoutePriority {
  NEAREST = 'nearest',
  CHEAPEST = 'cheapest',
  SAFEST = 'safest',
  BEST_LIQUIDITY = 'best_liquidity',
  FASTEST = 'fastest',
}

export interface CashPoint {
  id: string;
  name: string;
  type: CashPointType;
  operatorName: string;
  operatorId: string;
  phone: string;
  email?: string;
  currencies: string[];
  liquidity: Record<string, number>;
  status: OperationalState;
  location: GeoLocation;
  operatingHours: OperatingHours;
  rating: number;
  reviewCount: number;
  fees: Record<string, number>;
  minAmount: number;
  maxAmount: number;
  lastSeen: Date;
  verified: boolean;
  reputation: ReputationScore;
  region: string;
  country: string;
  timezone: string;
  languages: string[];
  metadata: Record<string, unknown>;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  geohash: string;
}

export interface OperatingHours {
  timezone: string;
  schedule: DaySchedule[];
  is24Hours: boolean;
}

export interface DaySchedule {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface ReputationScore {
  overall: number;
  reliability: number;
  liquidityConsistency: number;
  customerRating: number;
  disputeRate: number;
  fraudFlags: number;
  totalTransactions: number;
  successfulTransactions: number;
  lastUpdated: Date;
}

export interface LiquiditySnapshot {
  cashPointId: string;
  currency: string;
  available: number;
  reserved: number;
  pending: number;
  healthScore: number; // 0-1
  lastUpdated: Date;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface WithdrawalRoute {
  id: string;
  cashPointId: string;
  cashPointName: string;
  distanceKm: number;
  estimatedTimeMinutes: number;
  fee: number;
  currency: string;
  availableLiquidity: number;
  routeConfidence: number; // 0-1
  routeType: RoutePriority;
  warnings: string[];
  recommended: boolean;
}

export interface CountryProfile {
  code: string;
  name: string;
  currencies: string[];
  primaryCurrency: string;
  settlementModes: SettlementMode[];
  cashOutMethods: string[];
  regulatoryMetadata: Record<string, string>;
  fxRouteCompatibility: string[];
  languages: string[];
  timezone: string;
  mobileMoneyProviders: string[];
  bankNetworkStatus: 'active' | 'limited' | 'unavailable';
  agentDensity: 'high' | 'medium' | 'low';
  averageInternetUptime: number; // percentage
}

export interface CrossBorderRoute {
  id: string;
  fromCountry: string;
  toCountry: string;
  fromCurrency: string;
  toCurrency: string;
  supportedMethods: string[];
  estimatedDuration: number; // minutes
  fxSpread: number;
  feeStructure: Record<string, number>;
  settlementMode: SettlementMode;
  regulatoryRequirements: string[];
  active: boolean;
  lastVerified: Date;
}

export interface SettlementBatch {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactions: string[];
  totalAmount: number;
  currency: string;
  route: string;
  createdAt: Date;
  scheduledAt: Date;
  completedAt?: Date;
  reconciled: boolean;
}

export interface OfflineTransaction {
  id: string;
  type: 'withdrawal' | 'deposit' | 'transfer';
  cashPointId: string;
  amount: number;
  currency: string;
  userId: string;
  status: 'queued' | 'synced' | 'failed' | 'cancelled';
  localTimestamp: Date;
  serverTimestamp?: Date;
  retryCount: number;
  maxRetries: number;
  payload: Record<string, unknown>;
}

export interface RegionGroup {
  id: string;
  name: string;
  country: string;
  cashPointIds: string[];
  language: string;
  currency: string;
  timezone: string;
  agentCount: number;
  totalLiquidity: Record<string, number>;
  coverageArea: GeoBounds;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface AgentVerification {
  agentId: string;
  kycLevel: number;
  verifiedAt: Date;
  verificationMethod: string;
  documents: string[];
  backgroundCheck: boolean;
  trainingCompleted: boolean;
  suspensionCount: number;
  lastReview: Date;
}
