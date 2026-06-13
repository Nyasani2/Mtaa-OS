/**
 * ASIS Shared Interfaces
 * Contract definitions for agents, services, and modules
 */

import { 
  AgentRequest, 
  AgentResponse, 
  UserContext, 
  ConversationContext,
  Recommendation,
  MemoryEntry,
} from './types';

// ============================================
// AGENT INTERFACE
// ============================================

export interface IASISAgent {
  readonly name: string;
  readonly version: string;
  readonly capabilities: string[];

  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  process(request: AgentRequest): Promise<AgentResponse>;
  canHandle(intent: string, entities: string[]): boolean;
}

// ============================================
// SERVICE INTERFACE (All external calls go through this)
// ============================================

export interface IASISService {
  readonly name: string;
  readonly endpoint: string;

  initialize(): Promise<void>;
  call<T>(method: string, params: any): Promise<T>;
  health(): Promise<{ status: string; latency: number }>;
}

// ============================================
// MEMORY INTERFACE
// ============================================

export interface IASISMemory {
  store(entry: MemoryEntry): Promise<void>;
  retrieve(key: string): Promise<MemoryEntry | null>;
  search(query: string, limit?: number): Promise<MemoryEntry[]>;
  forget(key: string): Promise<void>;
  getUserMemory(userId: string): Promise<MemoryEntry[]>;
}

// ============================================
// RECOMMENDATION ENGINE INTERFACE
// ============================================

export interface IASISRecommendationEngine {
  generateRecommendations(context: any): Promise<Recommendation[]>;
  trackFeedback(recommendationId: string, feedback: 'accepted' | 'rejected' | 'ignored'): Promise<void>;
  getUserPreferences(userId: string): Promise<any>;
}

// ============================================
// CHAT INTERFACE
// ============================================

export interface IASISChat {
  sendMessage(content: string, options?: any): Promise<void>;
  streamMessage(content: string, onChunk: (chunk: string) => void): Promise<void>;
  getHistory(sessionId: string): Promise<ConversationContext | null>;
  clearHistory(sessionId: string): Promise<void>;
}

// ============================================
// SECURITY INTERFACE
// ============================================

export interface IASISSecurity {
  verifyIdentity(userId: string, method: 'pin' | 'biometric' | 'password', credential: any): Promise<boolean>;
  checkPermission(userId: string, action: string): Promise<boolean>;
  logAction(userId: string, action: string, details: any): Promise<void>;
  encrypt(data: any): Promise<string>;
  decrypt(encrypted: string): Promise<any>;
}

// ============================================
// CONTEXT INTERFACE
// ============================================

export interface IASISContext {
  getUser(): UserContext | null;
  getSystem(): any;
  getConversation(sessionId: string): ConversationContext | null;
  updateUser(user: Partial<UserContext>): void;
  setIntent(intent: string): void;
}

// ============================================
// TOOL INTERFACE
// ============================================

export interface IASISTool {
  readonly name: string;
  readonly description: string;
  readonly parameters: any; // JSON Schema
  readonly requiresAuth: boolean;
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';

  execute(params: any, context: any): Promise<any>;
  validate(params: any): boolean;
}
