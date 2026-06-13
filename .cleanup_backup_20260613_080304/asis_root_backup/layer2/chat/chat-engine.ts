/**
 * ASIS Chat Engine
 * Main orchestrator for chat interactions
 * Bridges UI, session management, streaming, and ASIS core
 */

import { ASIS } from '../index';
import { ASISChatSession } from './chat-session';
import { ASISStreamHandler } from './stream-handler';
import { ASISPromptPipeline } from './prompt-pipeline';
import { ASISMessageRenderer } from './message-renderer';
import {
  ChatMessage,
  ChatSessionConfig,
  ChatSessionState,
  ChatAction,
  StreamConfig,
  MessageType,
  MessageStatus,
} from './types';
import { sanitizeInput, generateId } from '../shared/utils';
import { View } from 'react-native';


export interface ChatEngineOptions {
  asis: ASIS;
  sessionConfig?: Partial<ChatSessionConfig>;
  streamConfig?: Partial<StreamConfig>;
}

export class ASISChatEngine {
  private _asis: ASIS;
  private _session: ASISChatSession;
  private _streamHandler: ASISStreamHandler;
  private _promptPipeline: ASISPromptPipeline;
  private _renderer: ASISMessageRenderer;
  private _config: ChatSessionConfig;
  private _streamConfig: StreamConfig;
  private _listeners: Set<(state: ChatSessionState) => void> = new Set();
  private _initialized: boolean = false;

  constructor(options: ChatEngineOptions) {
    this._asis = options.asis;
    this._config = {
      maxHistory: 50,
      autoSave: true,
      persistAcrossSessions: true,
      typingIndicatorDelay: 500,
      streamChunkDelay: 30,
      enableSuggestions: true,
      enableVoice: false,
      theme: 'system',
      ...options.sessionConfig,
    };
    this._streamConfig = {
      enabled: true,
      chunkSize: 10,
      chunkDelayMs: 30,
      maxDurationMs: 30000,
      abortOnError: true,
      ...options.streamConfig,
    };

    this._session = new ASISChatSession(this._config);
    this._streamHandler = new ASISStreamHandler(this._streamConfig);
    this._promptPipeline = new ASISPromptPipeline();
    this._renderer = new ASISMessageRenderer();
  }

  async initialize(): Promise<void> {
    await this._session.initialize();
    this._setupEventListeners();
    this._initialized = true;
    console.log('[ASIS:ChatEngine] Initialized');
  }

  async shutdown(): Promise<void> {
    this._listeners.clear();
    await this._session.shutdown();
    this._initialized = false;
    console.log('[ASIS:ChatEngine] Shutdown');
  }

  private _setupEventListeners(): void {
    // Listen for ASIS responses
    this._asis.eventBus.on('asis:agent:response', (event) => {
      this._handleAgentResponse(event.payload);
    });

    // Listen for confirmation requests
    this._asis.eventBus.on('asis:confirmation:required', (event) => {
      this._handleConfirmationRequest(event.payload);
    });

    // Listen for errors
    this._asis.eventBus.on('asis:error', (event) => {
      this._addSystemMessage(event.payload.message, 'error');
    });
  }

  get state(): ChatSessionState {
    return this._session.state;
  }

  subscribe(listener: (state: ChatSessionState) => void): () => void {
    this._listeners.add(listener);
    // Immediately notify with current state
    listener(this.state);
    return () => this._listeners.delete(listener);
  }

  private _notify(): void {
    const state = this.state;
    this._listeners.forEach((listener) => listener(state));
  }

  async sendMessage(content: string): Promise<void> {
    if (!this._initialized) {
      throw new Error('ChatEngine not initialized');
    }

    const sanitized = sanitizeInput(content);
    if (!sanitized.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId('msg'),
      role: 'user',
      content: sanitized,
      timestamp: Date.now(),
      status: 'sent',
      type: 'text',
    };

    this._session.addMessage(userMessage);
    this._notify();

    // Show typing indicator
    this._session.setLoading(true);
    this._notify();

    // Build prompt context
    const promptContext = this._promptPipeline.buildContext({
      userMessage: sanitized,
      conversationHistory: this._session.messages,
      systemContext: this._asis.context.getSystemContext(),
      userContext: this._asis.context.getUserContext(),
      availableTools: this._asis.orchestrator.registeredAgents,
      countryProfile: this._asis.config.countryProfile,
    });

    // Process through orchestrator
    try {
      const response = await this._asis.orchestrator.processUserInput(
        sanitized,
        this._session.id
      );

      this._session.setLoading(false);

      if (response.type === 'stream' && this._streamConfig.enabled) {
        await this._handleStreamingResponse(response);
      } else {
        await this._handleStandardResponse(response);
      }
    } catch (error) {
      this._session.setLoading(false);
      this._addSystemMessage(
        'Sorry, I could not process your request. Please try again.',
        'error'
      );
      console.error('[ASIS:ChatEngine] Error processing message:', error);
    }

    this._notify();
  }

  private async _handleStandardResponse(response: any): Promise<void> {
    const message: ChatMessage = {
      id: generateId('msg'),
      role: 'asis',
      content: response.content,
      timestamp: Date.now(),
      status: 'delivered',
      type: this._mapResponseType(response.type),
      actions: response.actions?.map((a: any) => ({
        id: a.id || generateId('act'),
        label: a.label,
        type: 'button',
        variant: a.requiresAuth ? 'primary' : 'secondary',
        payload: a.payload,
      })),
    };

    this._session.addMessage(message);

    // Generate suggestions if enabled
    if (this._config.enableSuggestions) {
      const suggestions = this._generateSuggestions(response);
      this._session.setSuggestions(suggestions);
    }
  }

  private async _handleStreamingResponse(response: any): Promise<void> {
    const messageId = generateId('msg');

    // Create placeholder message
    const placeholder: ChatMessage = {
      id: messageId,
      role: 'asis',
      content: '',
      timestamp: Date.now(),
      status: 'sending',
      type: 'stream',
      isStreaming: true,
      streamChunks: [],
    };

    this._session.addMessage(placeholder);
    this._session.setStreaming(true);
    this._notify();

    // Start streaming
    const stream = this._streamHandler.createStream(response.content);

    for await (const chunk of stream) {
      this._session.appendStreamChunk(messageId, chunk);
      this._notify();
    }

    // Finalize
    this._session.finalizeStream(messageId);
    this._session.setStreaming(false);
  }

  private _handleAgentResponse(payload: any): void {
    // Handle direct agent responses (non-user-triggered)
    if (payload.agentName && payload.response) {
      const message: ChatMessage = {
        id: generateId('msg'),
        role: 'asis',
        content: payload.response.content,
        timestamp: Date.now(),
        status: 'delivered',
        type: 'text',
      };
      this._session.addMessage(message);
      this._notify();
    }
  }

  private _handleConfirmationRequest(payload: any): void {
    const message: ChatMessage = {
      id: generateId('msg'),
      role: 'asis',
      content: payload.message || 'This action requires your confirmation.',
      timestamp: Date.now(),
      status: 'delivered',
      type: 'action',
      actions: [
        {
          id: generateId('act'),
          label: 'Confirm',
          type: 'button',
          variant: 'primary',
          payload: { action: 'confirm', ...payload },
        },
        {
          id: generateId('act'),
          label: 'Cancel',
          type: 'button',
          variant: 'ghost',
          payload: { action: 'cancel', ...payload },
        },
      ],
    };

    this._session.addMessage(message);
    this._notify();
  }

  private _addSystemMessage(content: string, type: MessageType = 'system'): void {
    const message: ChatMessage = {
      id: generateId('msg'),
      role: 'system',
      content,
      timestamp: Date.now(),
      status: 'delivered',
      type,
    };
    this._session.addMessage(message);
  }

  private _mapResponseType(type: string): MessageType {
    const typeMap: Record<string, MessageType> = {
      text: 'text',
      action: 'action',
      confirmation_required: 'action',
      error: 'error',
      stream: 'stream',
      card: 'card',
    };
    return typeMap[type] || 'text';
  }

  private _generateSuggestions(response: any): string[] {
    const suggestions: string[] = [];

    if (response.metadata?.intent === 'wallet') {
      suggestions.push('Check my balance', 'View transactions', 'Send money');
    } else if (response.metadata?.intent === 'transport') {
      suggestions.push('Book a ride', 'Track my delivery', 'Find nearest driver');
    } else if (response.metadata?.intent === 'jobs') {
      suggestions.push('Search jobs', 'Update my CV', 'View applications');
    } else if (response.metadata?.intent === 'health') {
      suggestions.push('Book appointment', 'Find a doctor', 'View my records');
    } else {
      suggestions.push('What can you do?', 'Help me with wallet', 'Find a job');
    }

    return suggestions.slice(0, 3);
  }

  executeAction(action: ChatAction): void {
    this._asis.eventBus.emit('asis:chat:action', {
      actionId: action.id,
      payload: action.payload,
      timestamp: Date.now(),
    });

    // Handle built-in actions
    if (action.payload?.action === 'confirm') {
      this._handleConfirmation(action.payload);
    }
  }

  private async _handleConfirmation(payload: any): Promise<void> {
    // Re-submit the pending action with confirmation
    const { pendingAction } = payload;
    if (pendingAction) {
      // In production, this would trigger PIN/biometric flow
      // Then re-execute the original action
      this._asis.security.verifyPin(
        this._asis.context.getUserContext()?.id || '',
        payload.pin || ''
      ).then((verified) => {
        if (verified) {
          this._asis.eventBus.emit('asis:action:confirmed', pendingAction);
        } else {
          this._addSystemMessage('Confirmation failed. Please try again.', 'error');
          this._notify();
        }
      });
    }
  }

  clearHistory(): void {
    this._session.clear();
    this._notify();
  }

  exportHistory(): ChatMessage[] {
    return this._session.exportMessages();
  }

  get sessionId(): string {
    return this._session.id;
  }
}