/**
 * ASIS Chat Session
 * Manages conversation state, message history, and persistence
 */

import { ChatMessage, ChatSessionConfig, ChatSessionState, MessageStatus } from './types';
import { generateId } from '../shared/utils';

export class ASISChatSession {
  private _id: string;
  private _messages: ChatMessage[] = [];
  private _isLoading: boolean = false;
  private _isStreaming: boolean = false;
  private _error: string | null = null;
  private _suggestions: string[] = [];
  private _config: ChatSessionConfig;
  private _context = {
    intent: null as string | null,
    entities: [] as string[],
    lastAction: null as string | null,
  };

  constructor(config: ChatSessionConfig) {
    this._config = config;
    this._id = generateId('session');
  }

  async initialize(): Promise<void> {
    // Load persisted session if available
    if (this._config.persistAcrossSessions) {
      const saved = this._loadFromStorage();
      if (saved) {
        this._messages = saved.messages;
        this._context = saved.context;
      }
    }
    console.log(`[ASIS:ChatSession] Initialized: ${this._id}`);
  }

  async shutdown(): Promise<void> {
    if (this._config.autoSave) {
      this._saveToStorage();
    }
    console.log(`[ASIS:ChatSession] Shutdown: ${this._id}`);
  }

  get id(): string {
    return this._id;
  }

  get messages(): ChatMessage[] {
    return [...this._messages];
  }

  get state(): ChatSessionState {
    return {
      id: this._id,
      messages: [...this._messages],
      isLoading: this._isLoading,
      isStreaming: this._isStreaming,
      error: this._error,
      suggestions: [...this._suggestions],
      context: { ...this._context },
    };
  }

  addMessage(message: ChatMessage): void {
    this._messages.push(message);
    this._trimHistory();

    if (this._config.autoSave) {
      this._saveToStorage();
    }
  }

  updateMessageStatus(messageId: string, status: MessageStatus): void {
    const message = this._messages.find((m) => m.id === messageId);
    if (message) {
      message.status = status;
    }
  }

  appendStreamChunk(messageId: string, chunk: string): void {
    const message = this._messages.find((m) => m.id === messageId);
    if (message && message.isStreaming) {
      message.content += chunk;
      message.streamChunks = message.streamChunks || [];
      message.streamChunks.push(chunk);
    }
  }

  finalizeStream(messageId: string): void {
    const message = this._messages.find((m) => m.id === messageId);
    if (message) {
      message.isStreaming = false;
      message.status = 'delivered';
      message.type = 'text';
    }
  }

  setLoading(loading: boolean): void {
    this._isLoading = loading;
  }

  setStreaming(streaming: boolean): void {
    this._isStreaming = streaming;
  }

  setError(error: string | null): void {
    this._error = error;
  }

  setSuggestions(suggestions: string[]): void {
    this._suggestions = suggestions;
  }

  setContext(intent: string | null, entities: string[]): void {
    this._context.intent = intent;
    this._context.entities = entities;
  }

  setLastAction(action: string): void {
    this._context.lastAction = action;
  }

  clear(): void {
    this._messages = [];
    this._isLoading = false;
    this._isStreaming = false;
    this._error = null;
    this._suggestions = [];
    this._context = { intent: null, entities: [], lastAction: null };
    this._clearStorage();
  }

  exportMessages(): ChatMessage[] {
    return [...this._messages];
  }

  private _trimHistory(): void {
    if (this._messages.length > this._config.maxHistory) {
      this._messages = this._messages.slice(-this._config.maxHistory);
    }
  }

  private _saveToStorage(): void {
    try {
      const data = {
        id: this._id,
        messages: this._messages,
        context: this._context,
        timestamp: Date.now(),
      };
      // In React Native: AsyncStorage.setItem(`asis_chat_${this._id}`, JSON.stringify(data))
      // In web: localStorage.setItem(`asis_chat_${this._id}`, JSON.stringify(data))
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`asis_chat_${this._id}`, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('[ASIS:ChatSession] Failed to save to storage:', e);
    }
  }

  private _loadFromStorage(): any | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(`asis_chat_${this._id}`);
        return data ? JSON.parse(data) : null;
      }
    } catch (e) {
      console.warn('[ASIS:ChatSession] Failed to load from storage:', e);
    }
    return null;
  }

  private _clearStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`asis_chat_${this._id}`);
      }
    } catch (e) {
      console.warn('[ASIS:ChatSession] Failed to clear storage:', e);
    }
  }
}
