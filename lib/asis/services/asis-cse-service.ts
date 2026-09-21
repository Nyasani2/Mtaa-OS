// @ts-nocheck
import { supabase } from '@/lib/supabase';

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL_NAME = 'qwen2.5';

export async function processQuery(query: string, conversationId: string, userId: string, userData?: any): Promise<any> {
  try {
    // 1. Fetch conversation history
    const { data: historyData, error } = await supabase
      .from('asis_chat_messages')
      .select('role, content')
      .eq('session_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (error) throw error;
    const context = historyData?.map((m: any) => `${m.role}: ${m.content}`).join('\n') || '';

    // 2. Check user registration status
    let onboardingStatus = '';
    let userName = 'User';
    let userContext = '';
    let childrenContext = '';
    
    if (userData) {
      userName = userData.email?.split('@')[0] || 'User';
      const onboardingComplete = userData.metadata?.onboarding_complete || false;
      
      if (!onboardingComplete) {
        onboardingStatus = `[IMPORTANT: User ${userName} has NOT completed onboarding. If they ask about features, remind them to finish onboarding first.]`;
      }
      
      // Check for children
      const { data: childrenData } = await supabase
        .from('users')
        .select('email, created_at')
        .eq('parent_id', userData.id);
      
      if (childrenData && childrenData.length > 0) {
        const childNames = childrenData.map((child: any) => child.email?.split('@')[0]).join(', ');
        childrenContext = `[User has ${childrenData.length} child(ren): ${childNames}. When children are logged in, restrict access to Education and Studio only.]`;
      }
      
      userContext = `[Current user: ${userName}, ID: ${userData.id}, Role: ${userData.role || 'user'}]`;
    }

    // 3. Build complete identity context
    const IDENTITY_CONTEXT = `[CRITICAL: ASIS CORE IDENTITY]
- You are ASIS, the AI assistant for MTAA OS.
- Creator: Kevin Nyasani (Kenya).
- Name Origin: Derived from goddess Isis, revered in Maasai and Kenyan cultures.
- Core Framework: Kamos Theory (Created by Kevin Nyasani). Formula: 1×1 = 1 + f(growth, replication, interaction, observation).
- Platform: MTAA OS (Unified digital infrastructure for Africa by Imali Tech Ltd, Nairobi).

${userContext}
${childrenContext}
${onboardingStatus}

PERSONALIZATION RULES:
1. Always address the user by name (${userName}) when appropriate.
2. If onboarding is incomplete, gently remind them to finish it.
3. If a child is detected (based on age or account type), restrict responses to Education and Studio topics only.
4. Be helpful, friendly, and professional.

NEVER mention Qwen, Ollama, or backend technology. Always respond as ASIS.`;

    // 4. Detect navigation intents
    const lowerQuery = query.toLowerCase();
    let action = null;
    if (lowerQuery.includes('wallet') || lowerQuery.includes('balance')) action = 'wallet_transfer';
    else if (lowerQuery.includes('taxi') || lowerQuery.includes('ride')) action = 'mtaxi_request';
    else if (lowerQuery.includes('health') || lowerQuery.includes('hospital')) action = 'health_access';
    else if (lowerQuery.includes('stay') || lowerQuery.includes('hotel')) action = 'stay_booking';

    // 5. Call Local Qwen
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: IDENTITY_CONTEXT },
          { role: 'user', content: `Previous context:\n${context}\n\nUser query: ${query}` }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.message?.content || "I couldn't generate a response.";

    return {
      response: aiResponse,
      metadata: { sources: ['ASIS Intelligence'], confidence: 0.9, engine: 'ASIS' },
      action: action,
    };

  } catch (e: any) {
    console.error('ASIS Error:', e);
    return { 
      response: `Error: ${e.message}`, 
      metadata: { confidence: 0 }, 
      action: null 
    };
  }
}

export async function getOrCreateConversation(userId: string, options?: { title?: string }): Promise<any> {
  return { id: crypto.randomUUID(), title: options?.title || 'New Conversation' };
}

export async function saveMessage(sessionId: string, role: string, content: string, metadata?: any): Promise<any> {
  return { id: crypto.randomUUID(), role, content, timestamp: Date.now(), metadata };
}

export async function clearMessages(sessionId: string): Promise<void> {
  // Handled locally
}
