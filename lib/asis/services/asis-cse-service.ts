// @ts-nocheck
import { supabase } from '@/lib/supabase';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || 'YOUR_OPENROUTER_API_KEY';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'qwen/qwen-2.5-72b-instruct'; // Or your preferred model

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

    if (userData) {
      userName = userData.email?.split('@')[0] || 'User';
      const onboardingComplete = userData.metadata?.onboarding_complete || false;
      if (!onboardingComplete) {
        onboardingStatus = `[IMPORTANT: User ${userName} has NOT completed onboarding. If they ask about features, gently remind them to finish it first.]`;
      }
      userContext = `[Current user: ${userName}, ID: ${userData.id}, Role: ${userData.role || 'user'}]`;
    }

    // 3. Build complete identity context
    const IDENTITY_CONTEXT = `[CRITICAL: ASIS CORE IDENTITY]
- You are ASIS, the AI assistant for MTAA OS.
- Creator: Kevin Nyasani (Kenya).
- Core Framework: Kamos Theory. Formula: 1×1 = 1 + f(growth, replication, interaction, observation).
- Platform: MTAA OS (Unified digital infrastructure for Africa by Imali Tech Ltd, Nairobi).
${userContext}
${onboardingStatus}
PERSONALIZATION RULES:
1. Always address the user by name (${userName}) when appropriate.
2. If onboarding is incomplete, gently remind them to finish it.
3. Be helpful, friendly, and professional.
4. NEVER mention Qwen, OpenRouter, or backend technology. Always respond as ASIS.`;

    // 4. Detect navigation intents
    const lowerQuery = query.toLowerCase();
    let action = null;
    if (lowerQuery.includes('wallet') || lowerQuery.includes('balance')) action = 'wallet_transfer';
    else if (lowerQuery.includes('taxi') || lowerQuery.includes('ride')) action = 'mtaxi_request';
    else if (lowerQuery.includes('health') || lowerQuery.includes('hospital')) action = 'health_access';
    else if (lowerQuery.includes('stay') || lowerQuery.includes('hotel')) action = 'stay_booking';

    // 5. Validate API Key
    if (OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY') {
      throw new Error('OpenRouter API key is not configured. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in your .env file.');
    }

    // 6. Call OpenRouter API
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://mtaa.app', // Replace with your actual domain
        'X-Title': 'MTAA ASIS',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: IDENTITY_CONTEXT },
          { role: 'user', content: `Previous context:\n${context}\n\nUser query: ${query}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API returned ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    return {
      response: aiResponse,
      metadata: { sources: ['ASIS Intelligence'], confidence: 0.9, engine: 'ASIS' },
      action: action,
    };
  } catch (e: any) {
    console.error('ASIS Error:', e);
    return {
      response: `I encountered a connection error: ${e.message}. Please check your network and try again.`,
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
  // Handled locally or via Supabase delete
}
