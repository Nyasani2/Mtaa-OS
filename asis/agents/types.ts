/**
 * ASIS Agent Types
 * Type definitions for the agent subsystem
 */

import { AgentRequest, AgentResponse, IASISAgent } from '../shared/interfaces';

// ============================================
// AGENT REGISTRY
// ============================================

export interface AgentRegistryEntry {
  name: string;
  agent: IASISAgent;
  capabilities: string[];
  priority: number;
  enabled: boolean;
}

export interface AgentRegistry {
  register(entry: AgentRegistryEntry): void;
  unregister(name: string): void;
  get(name: string): IASISAgent | undefined;
  list(): AgentRegistryEntry[];
  findByIntent(intent: string): IASISAgent | undefined;
  findByCapability(capability: string): IASISAgent[];
}

// ============================================
// ROUTING
// ============================================

export interface IntentClassification {
  intent: string;
  confidence: number;
  agent: string;
  entities: Entity[];
  requiresConfirmation: boolean;
  suggestedActions: string[];
}

export interface Entity {
  type: string;
  value: string;
  start: number;
  end: number;
  confidence: number;
}

export interface RoutingDecision {
  targetAgent: string;
  confidence: number;
  intent: IntentClassification;
  fallbackAgents: string[];
  reasoning: string;
}

export interface ConfidenceScore {
  overall: number;
  intent: number;
  entity: number;
  context: number;
  threshold: number;
  isConfident: boolean;
}

// ============================================
// TOOLS
// ============================================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  returns: ToolReturn;
  requiresAuth: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  rateLimit?: number;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
}

export interface ToolReturn {
  type: string;
  description: string;
}

export interface ToolExecution {
  tool: string;
  params: Record<string, any>;
  executionId: string;
  timestamp: number;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

// ============================================
// PROMPTS
// ============================================

export interface AgentPrompt {
  system: string;
  context: string;
  examples: PromptExample[];
  constraints: string[];
}

export interface PromptExample {
  input: string;
  output: string;
  context?: string;
}

// ============================================
// AGENT STATE
// ============================================

export interface AgentState {
  name: string;
  status: 'idle' | 'processing' | 'error' | 'confirming';
  lastRequest: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
}

// ============================================
// WALLET AGENT SPECIFIC
// ============================================

export interface WalletAction {
  type: 'balance_check' | 'transfer' | 'payment' | 'withdrawal' | 'deposit' | 'transaction_history' | 'claim';
  params: Record<string, any>;
  requiresConfirmation: boolean;
}

export interface TransferIntent {
  recipient: string;
  amount: number;
  currency: string;
  description?: string;
  urgent?: boolean;
}

// ============================================
// TRANSPORT AGENT SPECIFIC
// ============================================

export interface TransportAction {
  type: 'book_taxi' | 'book_truck' | 'track_ride' | 'cancel_ride' | 'rate_driver' | 'estimate_fare';
  params: Record<string, any>;
}

export interface BookingIntent {
  vehicleType: 'taxi' | 'truck' | 'delivery';
  pickup: { lat: number; lng: number; address?: string };
  destination: { lat: number; lng: number; address?: string };
  scheduledTime?: number;
  passengers?: number;
  cargoType?: string;
}

// ============================================
// JOBS AGENT SPECIFIC
// ============================================

export interface JobsAction {
  type: 'search' | 'apply' | 'post' | 'save' | 'share' | 'cv_review' | 'salary_estimate';
  params: Record<string, any>;
}

export interface JobSearchIntent {
  keywords: string[];
  location?: string;
  salaryRange?: { min: number; max: number };
  jobType?: 'full-time' | 'part-time' | 'contract' | 'freelance';
  experience?: 'entry' | 'mid' | 'senior' | 'executive';
}

// ============================================
// HEALTH AGENT SPECIFIC
// ============================================

export interface HealthAction {
  type: 'book_appointment' | 'find_provider' | 'symptom_check' | 'access_records' | 'emergency';
  params: Record<string, any>;
  requiresConsent: boolean;
}

// ============================================
// ENGINEERING AGENT SPECIFIC
// ============================================

export interface EngineeringAction {
  type: 'simulate' | 'plan' | 'analyze' | 'design' | 'optimize';
  params: Record<string, any>;
  domain: 'infrastructure' | 'energy' | 'water' | 'transport' | 'agriculture';
}
