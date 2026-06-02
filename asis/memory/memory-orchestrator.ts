/**
 * ASIS Layer 4 — Memory Orchestrator
 * Coordinates all memory subsystems
 * Entry point for the memory layer
 */

import { MemoryEngine, MemoryEngineConfig } from './memory-engine';
import { SemanticSearch } from './semantic-search';
import { ContextBuilder } from './context-builder';
import { ConversationHistory } from './conversation-history';
import { BehaviorEventSystem } from './behavior-events';
import { PreferenceEngine } from './preference-engine';
import { PrivacyGate } from './privacy-gate';
import { DataExportEngine } from './data-export';
import { DataDeletionEngine } from './data-deletion';
import { ConsentManager } from './consent-manager';
import { AgentGuard } from './agent-guard';
import { MemoryIndexer } from './memory-indexer';

import { createEmbeddingProvider, IEmbeddingProvider } from './providers/embedding-provider';
import { createVectorStoreProvider, IVectorStoreProvider } from './providers/vector-store-provider';
import { createLLMProvider, ILLMProvider } from './providers/llm-provider';

import {
  EnrichedContext,
  ContextScope,
  MemoryLayer,
  MemoryQuery,
  MemoryEntry,
  BehaviorEvent,
  UserPreference,
  DataExportRequest,
  DataDeletionRequest,
  ConsentRecord,
} from '../types';

import { EventBus } from '../kernel/event-bus';

export interface MemoryOrchestratorConfig {
  memory?: Partial<MemoryEngineConfig>;
  embedding?: { provider: string; apiKey?: string; endpoint?: string; model?: string };
  vectorStore?: { provider: string; apiKey?: string; endpoint?: string; indexName?: string };
  llm?: { provider: string; apiKey?: string; endpoint?: string; model?: string };
  agentGuard?: { maxDelegationDepth?: number; maxParallelAgents?: number; agentTimeoutMs?: number };
}

export class MemoryOrchestrator {
  public memoryEngine: MemoryEngine;
  public semanticSearch: SemanticSearch;
  public contextBuilder: ContextBuilder;
  public conversationHistory: ConversationHistory;
  public behaviorEvents: BehaviorEventSystem;
  public preferenceEngine: PreferenceEngine;
  public privacyGate: PrivacyGate;
  public dataExport: DataExportEngine;
  public dataDeletion: DataDeletionEngine;
  public consentManager: ConsentManager;
  public agentGuard: AgentGuard;
  public indexer: MemoryIndexer;

  private embeddingProvider: IEmbeddingProvider;
  private vectorStoreProvider: IVectorStoreProvider;
  private llmProvider: ILLMProvider;
  private eventBus: EventBus;
  private userId: string;

  constructor(userId: string, config: MemoryOrchestratorConfig = {}, eventBus: EventBus) {
    this.userId = userId;
    this.eventBus = eventBus;

    // Initialize providers (no hardcoded vendors)
    this.embeddingProvider = createEmbeddingProvider({
      provider: (config.embedding?.provider as any) || 'local',
      apiKey: config.embedding?.apiKey,
      endpoint: config.embedding?.endpoint,
      model: config.embedding?.model,
      fallbackToLocal: true,
    });

    this.vectorStoreProvider = createVectorStoreProvider({
      provider: (config.vectorStore?.provider as any) || 'local',
      apiKey: config.vectorStore?.apiKey,
      endpoint: config.vectorStore?.endpoint,
      indexName: config.vectorStore?.indexName || 'asis_memory',
    });

    this.llmProvider = createLLMProvider({
      provider: (config.llm?.provider as any) || 'local',
      apiKey: config.llm?.apiKey,
      endpoint: config.llm?.endpoint,
      model: config.llm?.model,
    });

    // Initialize core systems
    this.memoryEngine = new MemoryEngine(userId, config.memory, eventBus);
    this.privacyGate = new PrivacyGate(userId, eventBus);
    this.agentGuard = new AgentGuard(config.agentGuard);
    this.indexer = new MemoryIndexer();

    // Initialize feature systems
    this.semanticSearch = new SemanticSearch(
      this.memoryEngine,
      this.embeddingProvider,
      this.vectorStoreProvider
    );

    this.contextBuilder = new ContextBuilder(
      this.memoryEngine,
      this.semanticSearch,
      { maxConversationHistory: 20, maxMemoryEntries: 50 }
    );

    this.conversationHistory = new ConversationHistory(this.memoryEngine);
    this.behaviorEvents = new BehaviorEventSystem(this.memoryEngine, eventBus);
    this.preferenceEngine = new PreferenceEngine(this.memoryEngine, eventBus);
    this.dataExport = new DataExportEngine(this.memoryEngine);
    this.dataDeletion = new DataDeletionEngine(this.memoryEngine, this.privacyGate);
    this.consentManager = new ConsentManager(this.privacyGate);
  }

  /**
   * Store memory
   */
  async store(
    layer: MemoryLayer,
    key: string,
    value: unknown,
    options?: Parameters<MemoryEngine['store']>[3]
  ): Promise<MemoryEntry> {
    return this.memoryEngine.store(layer, key, value, options);
  }

  /**
   * Retrieve memories
   */
  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    return this.memoryEngine.retrieve(query);
  }

  /**
   * Build context for current interaction
   */
  async buildContext(
    sessionId: string,
    currentInput: string,
    activeScopes: ContextScope[]
  ): Promise<EnrichedContext> {
    return this.contextBuilder.buildContext(this.userId, sessionId, currentInput, activeScopes);
  }

  /**
   * Start conversation
   */
  async startConversation(sessionId: string): Promise<any> {
    return this.conversationHistory.startSession(this.userId, sessionId);
  }

  /**
   * Add conversation turn
   */
  async addTurn(
    sessionId: string,
    role: 'user' | 'asis' | 'system' | 'agent',
    content: string,
    options?: Parameters<ConversationHistory['addTurn']>[3]
  ): Promise<any> {
    return this.conversationHistory.addTurn(sessionId, role, content, options);
  }

  /**
   * Record behavior event
   */
  async recordBehavior(event: Omit<BehaviorEvent, 'id' | 'timestamp'>): Promise<BehaviorEvent> {
    return this.behaviorEvents.record(event);
  }

  /**
   * Set preference
   */
  async setPreference(category: string, key: string, value: unknown, scope?: ContextScope): Promise<UserPreference> {
    return this.preferenceEngine.setPreference(category, key, value, scope);
  }

  /**
   * Get preference
   */
  async getPreference(key: string, scope?: ContextScope): Promise<UserPreference | null> {
    return this.preferenceEngine.getPreference(key, scope);
  }

  /**
   * Semantic search
   */
  async semanticQuery(query: string, scope?: ContextScope, topK?: number): Promise<any[]> {
    return this.semanticSearch.search(query, scope, topK);
  }

  /**
   * Request data export
   */
  async requestExport(formats: any[], scopes?: string[]): Promise<DataExportRequest> {
    const request = await this.privacyGate.requestExport(formats, scopes);
    return this.dataExport.processExport(request);
  }

  /**
   * Request data deletion
   */
  async requestDeletion(scopes: string[], deleteType?: 'soft' | 'hard' | 'anonymize'): Promise<DataDeletionRequest> {
    const request = await this.privacyGate.requestDeletion(scopes, deleteType);
    return this.dataDeletion.processDeletion(request);
  }

  /**
   * Request consent
   */
  async requestConsent(scope: ContextScope): Promise<ConsentRecord> {
    return this.consentManager.showConsent(scope);
  }

  /**
   * Grant consent
   */
  async grantConsent(consentId: string): Promise<ConsentRecord> {
    return this.privacyGate.grantConsent(consentId);
  }

  /**
   * Revoke consent
   */
  async revokeConsent(consentId: string): Promise<ConsentRecord> {
    return this.privacyGate.revokeConsent(consentId);
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: any): Promise<any> {
    return this.privacyGate.updateSettings(settings);
  }

  /**
   * Get health status
   */
  async health(): Promise<{
    memory: any;
    semantic: any;
    embedding: any;
    vectorStore: any;
    llm: any;
  }> {
    return {
      memory: await this.memoryEngine.getStats(),
      semantic: await this.semanticSearch.health(),
      embedding: await this.embeddingProvider.health(),
      vectorStore: await this.vectorStoreProvider.health(),
      llm: await this.llmProvider.health(),
    };
  }

  /**
   * Dispose and cleanup
   */
  async dispose(): Promise<void> {
    await this.behaviorEvents.flush();
    // Additional cleanup if needed
  }
}
