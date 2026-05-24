/**
 * ASIS Chat Types
 * Type definitions specific to the chat subsystem
 */

import { AgentResponse, AgentAction, ConversationMessage } from '../shared/types';

// ============================================
// CHAT UI TYPES
// ============================================

export type MessageType = 'text' | 'card' | 'action' | 'image' | 'file' | 'system' | 'error' | 'stream';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

export interface ChatMessage extends ConversationMessage {
  status: MessageStatus;
  type: MessageType;
  actions?: ChatAction[];
  card?: MessageCard;
  isStreaming?: boolean;
  streamChunks?: string[];
}

export interface ChatAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'quick_reply';
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: string;
  payload: any;
  disabled?: boolean;
  loading?: boolean;
}

export interface MessageCard {
  title: string;
  subtitle?: string;
  image?: string;
  description?: string;
  metadata?: Record<string, string>;
  actions?: ChatAction[];
}

// ============================================
// SESSION TYPES
// ============================================

export interface ChatSessionConfig {
  maxHistory: number;
  autoSave: boolean;
  persistAcrossSessions: boolean;
  typingIndicatorDelay: number;
  streamChunkDelay: number;
  enableSuggestions: boolean;
  enableVoice: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface ChatSessionState {
  id: string;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  suggestions: string[];
  context: {
    intent: string | null;
    entities: string[];
    lastAction: string | null;
  };
}

// ============================================
// STREAMING TYPES
// ============================================

export interface StreamConfig {
  enabled: boolean;
  chunkSize: number;
  chunkDelayMs: number;
  maxDurationMs: number;
  abortOnError: boolean;
}

export interface StreamState {
  isActive: boolean;
  chunks: string[];
  fullText: string;
  progress: number;
  error: string | null;
  abortController: AbortController | null;
}

export type StreamEvent = 
  | { type: 'chunk'; content: string }
  | { type: 'complete'; fullText: string }
  | { type: 'error'; message: string }
  | { type: 'abort' };

// ============================================
// RENDERER TYPES
// ============================================

export interface RenderOptions {
  animate: boolean;
  showTimestamp: boolean;
  showStatus: boolean;
  compact: boolean;
  maxLines: number;
}

export interface MarkdownConfig {
  enabled: boolean;
  allowLinks: boolean;
  allowCode: boolean;
  allowTables: boolean;
  maxHeadingLevel: number;
}

// ============================================
// PROMPT PIPELINE TYPES
// ============================================

export interface PromptContext {
  userMessage: string;
  conversationHistory: ChatMessage[];
  systemContext: any;
  userContext: any;
  availableTools: string[];
  countryProfile: any;
}

export interface ProcessedPrompt {
  systemPrompt: string;
  userPrompt: string;
  contextWindow: string[];
  tools: string[];
  constraints: string[];
}

// ============================================
// UI COMPONENT TYPES
// ============================================

export interface ChatUIProps {
  sessionId?: string;
  placeholder?: string;
  showHeader?: boolean;
  showSuggestions?: boolean;
  enableVoice?: boolean;
  onSend?: (message: string) => void;
  onAction?: (action: ChatAction) => void;
  onClose?: () => void;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isUser: boolean;
  showAvatar?: boolean;
  onAction?: (action: ChatAction) => void;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: (transcript: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export interface TypingIndicatorProps {
  visible: boolean;
  text?: string;
  dots?: number;
}

// ============================================
// THEME TYPES
// ============================================

export interface ChatTheme {
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textMuted: string;
    border: string;
    userBubble: string;
    userText: string;
    asisBubble: string;
    asisText: string;
    error: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  typography: {
    fontFamily: string;
    sizeSm: number;
    sizeMd: number;
    sizeLg: number;
    lineHeight: number;
  };
}

export const LIGHT_THEME: ChatTheme = {
  colors: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    primary: '#0066CC',
    secondary: '#6C757D',
    text: '#212529',
    textMuted: '#6C757D',
    border: '#DEE2E6',
    userBubble: '#0066CC',
    userText: '#FFFFFF',
    asisBubble: '#E9ECEF',
    asisText: '#212529',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  borderRadius: { sm: 8, md: 12, lg: 16, full: 9999 },
  typography: {
    fontFamily: 'System',
    sizeSm: 12,
    sizeMd: 14,
    sizeLg: 16,
    lineHeight: 1.5,
  },
};

export const DARK_THEME: ChatTheme = {
  colors: {
    background: '#0D1117',
    surface: '#161B22',
    primary: '#58A6FF',
    secondary: '#8B949E',
    text: '#C9D1D9',
    textMuted: '#8B949E',
    border: '#30363D',
    userBubble: '#1F6FEB',
    userText: '#FFFFFF',
    asisBubble: '#21262D',
    asisText: '#C9D1D9',
    error: '#F85149',
    success: '#3FB950',
    warning: '#D29922',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  borderRadius: { sm: 8, md: 12, lg: 16, full: 9999 },
  typography: {
    fontFamily: 'System',
    sizeSm: 12,
    sizeMd: 14,
    sizeLg: 16,
    lineHeight: 1.5,
  },
};
