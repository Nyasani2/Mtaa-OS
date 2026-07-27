/**
 * ASIS CSE v2 — Chat / Session Memory Engine
 * Manages conversation context, session state, user memories, and context windows.
 * Self-contained. No external APIs. Supabase-backed with in-memory fallback.
 *
 * @module lib/asis-cse/asis-cse-chat
 */

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

// ============================================================================
// TYPES
// ============================================================================

export interface AsisMessage {
  id: string;
  session_id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AsisSession {
  id: string;
  user_id: string;
  title: string;
  context_window: number;
  last_active: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface AsisMemory {
  id: string;
  user_id: string;
  key: string;
  value: string;
  category: 'preference' | 'fact' | 'context' | 'profile';
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface ChatContext {
  session: AsisSession | null;
  messages: AsisMessage[];
  memories: AsisMemory[];
  summary: string;
}

// ============================================================================
// IN-MEMORY FALLBACK (when Supabase tables not yet migrated)
// ============================================================================

const _memoryStore: Map<string, AsisSession> = new Map();
const _messageStore: Map<string, AsisMessage[]> = new Map();
const _userMemories: Map<string, AsisMemory[]> = new Map();

let _tableCheckDone = false;
let _tablesExist = { sessions: false, messages: false, memories: false };

async function _checkTables(): Promise<void> {
  if (_tableCheckDone) return;
  try {
    const { data: sess } = await supabase.from('asis_sessions').select('id').limit(1);
    _tablesExist.sessions = sess !== null;
  } catch { _tablesExist.sessions = false; }
  try {
    const { data: msg } = await supabase.from('asis_messages').select('id').limit(1);
    _tablesExist.messages = msg !== null;
  } catch { _tablesExist.messages = false; }
  try {
    const { data: mem } = await supabase.from('asis_memories').select('id').limit(1);
    _tablesExist.memories = mem !== null;
  } catch { _tablesExist.memories = false; }
  _tableCheckDone = true;
}

function _generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export async function createSession(title = 'ASIS Conversation'): Promise<AsisSession> {
  const userId = useAuthStore.getState()?.user?.id || 'anonymous';
  const session: AsisSession = {
    id: _generateId(),
    user_id: userId,
    title,
    context_window: 20,
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    metadata: {},
  };

  await _checkTables();
  if (_tablesExist.sessions) {
    await supabase.from('asis_sessions').insert(session);
  } else {
    _memoryStore.set(session.id, session);
    _messageStore.set(session.id, []);
  }
  return session;
}

export async function getSession(sessionId: string): Promise<AsisSession | null> {
  await _checkTables();
  if (_tablesExist.sessions) {
    const { data, error } = await supabase
      .from('asis_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (error || !data) return null;
    return data as AsisSession;
  }
  return _memoryStore.get(sessionId) || null;
}

export async function getUserSessions(userId?: string): Promise<AsisSession[]> {
  const uid = userId || useAuthStore.getState()?.user?.id || 'anonymous';
  await _checkTables();
  if (_tablesExist.sessions) {
    const { data, error } = await supabase
      .from('asis_sessions')
      .select('*')
      .eq('user_id', uid)
      .order('last_active', { ascending: false })
      .limit(50);
    if (error || !data) return [];
    return data as AsisSession[];
  }
  return Array.from(_memoryStore.values()).filter(s => s.user_id === uid);
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  const now = new Date().toISOString();
  await _checkTables();
  if (_tablesExist.sessions) {
    await supabase.from('asis_sessions').update({ last_active: now }).eq('id', sessionId);
  } else {
    const s = _memoryStore.get(sessionId);
    if (s) s.last_active = now;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await _checkTables();
  if (_tablesExist.sessions) {
    await supabase.from('asis_messages').delete().eq('session_id', sessionId);
    await supabase.from('asis_sessions').delete().eq('id', sessionId);
  }
  _memoryStore.delete(sessionId);
  _messageStore.delete(sessionId);
}

// ============================================================================
// MESSAGE MANAGEMENT (Context Window)
// ============================================================================

export async function addMessage(
  sessionId: string,
  role: AsisMessage['role'],
  content: string,
  metadata?: Record<string, any>
): Promise<AsisMessage> {
  const message: AsisMessage = {
    id: _generateId(),
    session_id: sessionId,
    role,
    content,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  await _checkTables();
  if (_tablesExist.messages) {
    await supabase.from('asis_messages').insert(message);
  } else {
    const list = _messageStore.get(sessionId) || [];
    list.push(message);
    _messageStore.set(sessionId, list);
  }
  await updateSessionActivity(sessionId);
  return message;
}

export async function getMessages(sessionId: string, limit = 20): Promise<AsisMessage[]> {
  await _checkTables();
  if (_tablesExist.messages) {
    const { data, error } = await supabase
      .from('asis_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as AsisMessage[]).reverse();
  }
  const list = _messageStore.get(sessionId) || [];
  return list.slice(-limit);
}

export async function getContextWindow(sessionId: string, maxMessages = 20): Promise<string> {
  const messages = await getMessages(sessionId, maxMessages);
  return messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');
}

export async function buildPromptWithContext(
  sessionId: string,
  systemPrompt: string,
  userMessage: string,
  maxContext = 20
): Promise<string> {
  const history = await getContextWindow(sessionId, maxContext);
  const parts: string[] = [];
  if (systemPrompt) parts.push(`SYSTEM: ${systemPrompt}`);
  if (history) parts.push(`CONVERSATION HISTORY:\n${history}`);
  parts.push(`USER: ${userMessage}`);
  parts.push('ASSISTANT:');
  return parts.join('\n\n');
}

// ============================================================================
// LONG-TERM MEMORY (User Preferences & Facts)
// ============================================================================

export async function storeMemory(
  key: string,
  value: string,
  category: AsisMemory['category'] = 'fact',
  confidence = 1.0
): Promise<AsisMemory> {
  const userId = useAuthStore.getState()?.user?.id || 'anonymous';
  const memory: AsisMemory = {
    id: _generateId(),
    user_id: userId,
    key,
    value,
    category,
    confidence,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await _checkTables();
  if (_tablesExist.memories) {
    await supabase.from('asis_memories').insert(memory);
  } else {
    const list = _userMemories.get(userId) || [];
    list.push(memory);
    _userMemories.set(userId, list);
  }
  return memory;
}

export async function getMemories(
  category?: AsisMemory['category'],
  limit = 50
): Promise<AsisMemory[]> {
  const userId = useAuthStore.getState()?.user?.id || 'anonymous';
  await _checkTables();
  if (_tablesExist.memories) {
    let q = supabase
      .from('asis_memories')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (category) q = q.eq('category', category);
    const { data, error } = await q;
    if (error || !data) return [];
    return data as AsisMemory[];
  }
  const list = _userMemories.get(userId) || [];
  return category ? list.filter(m => m.category === category) : list;
}

export async function recallMemory(keyPattern: string): Promise<AsisMemory | null> {
  const memories = await getMemories();
  const match = memories.find(m =>
    m.key.toLowerCase().includes(keyPattern.toLowerCase()) ||
    m.value.toLowerCase().includes(keyPattern.toLowerCase())
  );
  return match || null;
}

export async function updateMemory(id: string, value: string, confidence?: number): Promise<void> {
  await _checkTables();
  const now = new Date().toISOString();
  if (_tablesExist.memories) {
    const update: any = { value, updated_at: now };
    if (confidence !== undefined) update.confidence = confidence;
    await supabase.from('asis_memories').update(update).eq('id', id);
  } else {
    const userId = useAuthStore.getState()?.user?.id || 'anonymous';
    const list = _userMemories.get(userId) || [];
    const mem = list.find(m => m.id === id);
    if (mem) {
      mem.value = value;
      mem.updated_at = now;
      if (confidence !== undefined) mem.confidence = confidence;
    }
  }
}

// ============================================================================
// CONTEXT BUILDER (Full chat context for engines)
// ============================================================================

export async function buildChatContext(sessionId: string): Promise<ChatContext> {
  const [session, messages, memories] = await Promise.all([
    getSession(sessionId),
    getMessages(sessionId, 20),
    getMemories(undefined, 20),
  ]);

  const recent = messages.slice(-10);
  const summary = recent.length > 0
    ? `Recent topics: ${recent.map(m => m.content.substring(0, 60)).join('; ')}`
    : 'New conversation';

  return { session, messages, memories, summary };
}

// ============================================================================
// SESSION MEMORY ENGINE (CSE Engine Interface)
// ============================================================================

export interface MemoryEngineResult {
  context: string;
  memories: AsisMemory[];
  summary: string;
  messageCount: number;
}

export async function executeMemoryEngine(sessionId: string): Promise<MemoryEngineResult> {
  const ctx = await buildChatContext(sessionId);
  const relevantMemories = ctx.memories.filter(m =>
    ctx.messages.some(msg =>
      msg.content.toLowerCase().includes(m.key.toLowerCase()) ||
      msg.content.toLowerCase().includes(m.value.toLowerCase())
    )
  );

  const memoryContext = relevantMemories.length > 0
    ? `RELEVANT MEMORIES:\n${relevantMemories.map(m => `- ${m.key}: ${m.value}`).join('\n')}`
    : '';

  const fullContext = [
    ctx.summary,
    memoryContext,
    ctx.messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n'),
  ].filter(Boolean).join('\n\n');

  return {
    context: fullContext,
    memories: relevantMemories,
    summary: ctx.summary,
    messageCount: ctx.messages.length,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ChatEngine = {
  createSession,
  getSession,
  getUserSessions,
  deleteSession,
  addMessage,
  getMessages,
  getContextWindow,
  buildPromptWithContext,
  storeMemory,
  getMemories,
  recallMemory,
  updateMemory,
  buildChatContext,
  executeMemoryEngine,
};

export default ChatEngine;
