/**
 * ASIS Context Engine
 * Maintains conversation context, user state, and system awareness
 */

import { ASISEventBus } from './event-bus';
import { ASISSecurityLayer } from '../security/security-layer';
import { UserContext, SystemContext, ConversationContext } from '../shared/types';

export interface ContextSnapshot {
  user: UserContext | null;
  system: SystemContext;
  conversation: ConversationContext;
  timestamp: number;
  sessionId: string;
}

export class ASISContextEngine {
  private _eventBus: ASISEventBus;
  private _security: ASISSecurityLayer;
  private _userContext: UserContext | null = null;
  private _systemContext: SystemContext;
  private _conversationHistory: Map<string, ConversationContext> = new Map();
  private _activeSessionId: string | null = null;
  private _initialized: boolean = false;

  constructor(eventBus: ASISEventBus, security: ASISSecurityLayer) {
    this._eventBus = eventBus;
    this._security = security;
    this._systemContext = this._createDefaultSystemContext();
  }

  async initialize(): Promise<void> {
    this._setupEventListeners();
    this._initialized = true;
    console.log('[ASIS:ContextEngine] Initialized');
  }

  async shutdown(): Promise<void> {
    this._conversationHistory.clear();
    this._initialized = false;
    console.log('[ASIS:ContextEngine] Shutdown');
  }

  private _createDefaultSystemContext(): SystemContext {
    return {
      platform: 'mtaa_os',
      version: '1.0.0',
      environment: 'production',
      capabilities: [],
      activeModules: [],
      currentRoute: null,
      networkStatus: 'online',
      batteryLevel: null,
      timestamp: Date.now(),
    };
  }

  private _setupEventListeners(): void {
    this._eventBus.on('auth:user:login', (event) => {
      this.setUserContext(event.payload.user);
    });

    this._eventBus.on('auth:user:logout', () => {
      this.clearUserContext();
    });

    this._eventBus.on('app:route:change', (event) => {
      this._systemContext.currentRoute = event.payload.route;
      this._systemContext.timestamp = Date.now();
    });

    this._eventBus.on('system:network:change', (event) => {
      this._systemContext.networkStatus = event.payload.status;
    });

    this._eventBus.on('asis:module:registered', (event) => {
      if (!this._systemContext.activeModules.includes(event.payload.name)) {
        this._systemContext.activeModules.push(event.payload.name);
      }
    });
  }

  setUserContext(user: UserContext): void {
    if (!this._security.validateUserContext(user)) {
      this._eventBus.emit('asis:context:error', {
        error: 'Invalid user context',
        userId: user.id,
      }, { priority: 'high' });
      return;
    }

    this._userContext = {
      ...user,
      lastActive: Date.now(),
    };

    this._eventBus.emit('asis:context:user:set', {
      userId: user.id,
      timestamp: Date.now(),
    });
  }

  clearUserContext(): void {
    const previousUser = this._userContext;
    this._userContext = null;
    this._activeSessionId = null;

    if (previousUser) {
      this._eventBus.emit('asis:context:user:cleared', {
        previousUserId: previousUser.id,
        timestamp: Date.now(),
      });
    }
  }

  getUserContext(): UserContext | null {
    return this._userContext ? { ...this._userContext } : null;
  }

  getSystemContext(): SystemContext {
    return { ...this._systemContext };
  }

  startConversation(sessionId?: string): string {
    const id = sessionId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this._conversationHistory.set(id, {
      id,
      messages: [],
      startedAt: Date.now(),
      lastActivity: Date.now(),
      metadata: {
        source: 'user',
        intent: null,
        entities: [],
      },
    });

    this._activeSessionId = id;

    this._eventBus.emit('asis:conversation:start', { sessionId: id });
    return id;
  }

  addMessage(sessionId: string, role: 'user' | 'asis' | 'system', content: string, metadata?: any): void {
    const conversation = this._conversationHistory.get(sessionId);
    if (!conversation) {
      throw new Error(`Conversation ${sessionId} not found`);
    }

    conversation.messages.push({
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: Date.now(),
      metadata,
    });

    conversation.lastActivity = Date.now();

    if (metadata?.intent) {
      conversation.metadata.intent = metadata.intent;
    }
    if (metadata?.entities) {
      conversation.metadata.entities = [
        ...conversation.metadata.entities,
        ...metadata.entities,
      ];
    }

    this._eventBus.emit('asis:conversation:message', {
      sessionId,
      role,
      timestamp: Date.now(),
    });
  }

  getConversation(sessionId: string): ConversationContext | null {
    return this._conversationHistory.get(sessionId) || null;
  }

  getActiveConversation(): ConversationContext | null {
    return this._activeSessionId ? this.getConversation(this._activeSessionId) : null;
  }

  getRecentConversations(limit: number = 10): ConversationContext[] {
    return Array.from(this._conversationHistory.values())
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .slice(0, limit);
  }

  getSnapshot(): ContextSnapshot {
    return {
      user: this._userContext ? { ...this._userContext } : null,
      system: { ...this._systemContext },
      conversation: this._activeSessionId
        ? this.getConversation(this._activeSessionId)!
        : {
            id: '',
            messages: [],
            startedAt: Date.now(),
            lastActivity: Date.now(),
            metadata: { source: 'system', intent: null, entities: [] },
          },
      timestamp: Date.now(),
      sessionId: this._activeSessionId || '',
    };
  }

  detectIntent(message: string): { intent: string; confidence: number; entities: string[] } {
    const lowerMsg = message.toLowerCase();
    const entities: string[] = [];
    let intent = 'general';
    let confidence = 0.5;

    if (/send|transfer|pay|payment|wallet|balance|money/.test(lowerMsg)) {
      intent = 'wallet';
      confidence = 0.85;
      if (/send|transfer/.test(lowerMsg)) entities.push('transfer');
      if (/balance/.test(lowerMsg)) entities.push('balance_check');
      if (/pay|payment/.test(lowerMsg)) entities.push('payment');
    }
    else if (/taxi|ride|transport|mtaxi|mtruck|truck|delivery/.test(lowerMsg)) {
      intent = 'transport';
      confidence = 0.85;
      if (/taxi|ride/.test(lowerMsg)) entities.push('taxi');
      if (/truck|delivery/.test(lowerMsg)) entities.push('truck');
    }
    else if (/job|work|hire|salary|employment|cv|resume/.test(lowerMsg)) {
      intent = 'jobs';
      confidence = 0.8;
      if (/job|work/.test(lowerMsg)) entities.push('job_search');
      if (/hire|post/.test(lowerMsg)) entities.push('job_post');
    }
    else if (/health|doctor|hospital|clinic|appointment|symptom/.test(lowerMsg)) {
      intent = 'health';
      confidence = 0.8;
      if (/appointment/.test(lowerMsg)) entities.push('appointment');
      if (/symptom/.test(lowerMsg)) entities.push('symptom_check');
    }
    else if (/police|court|permit|license|government|civic/.test(lowerMsg)) {
      intent = 'civic';
      confidence = 0.8;
      if (/police/.test(lowerMsg)) entities.push('police');
      if (/court/.test(lowerMsg)) entities.push('court');
      if (/permit|license/.test(lowerMsg)) entities.push('permit');
    }
    else if (/help|how|what|faq|support/.test(lowerMsg)) {
      intent = 'help';
      confidence = 0.7;
    }

    return { intent, confidence, entities };
  }
}
