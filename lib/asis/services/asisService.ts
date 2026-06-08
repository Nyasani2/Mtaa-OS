// ASIS v1 - Client Service
// Handles all client-side ASIS communication through the edge function

import { supabase } from '@/lib/supabase';
import {
  AsisRequest,
  AsisResponse,
  AsisContext,
  AsisMessage,
  AsisDomain,
  AsisSession,
} from '../types';

const ASIS_EDGE_FUNCTION = 'asis-proxy';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

class AsisService {
  private currentSession: AsisSession | null = null;
  private messageQueue: AsisMessage[] = [];
  private isProcessing = false;

  /**
   * Initialize or resume an ASIS session
   */
  async initSession(userId: string, app: string): Promise<AsisSession> {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      id: sessionId,
      userId,
      app,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contextSnapshot: this.buildContext(userId, app),
    };

    // Load previous session history if exists
    const history = await this.loadSessionHistory(userId, app);
    this.currentSession.messages = history;

    return this.currentSession;
  }

  /**
   * Send a message to ASIS and get response
   */
  async sendMessage(
    message: string,
    domain: AsisDomain = 'general',
    attachments?: any[]
  ): Promise<AsisResponse> {
    if (!this.currentSession) {
      throw new Error('ASIS session not initialized. Call initSession() first.');
    }

    // Add user message to queue
    const userMessage: AsisMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      metadata: { domain, attachments },
    };

    this.messageQueue.push(userMessage);
    this.currentSession.messages.push(userMessage);

    // Process if not already processing
    if (!this.isProcessing) {
      return await this.processQueue(domain);
    }

    // Wait for current processing to complete
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!this.isProcessing) {
          clearInterval(check);
          this.processQueue(domain).then(resolve);
        }
      }, 100);
    });
  }

  /**
   * Process the message queue
   */
  private async processQueue(domain: AsisDomain): Promise<AsisResponse> {
    this.isProcessing = true;

    try {
      const message = this.messageQueue.shift();
      if (!message) {
        throw new Error('No message in queue');
      }

      const request: AsisRequest = {
        message: message.content,
        context: this.currentSession!.contextSnapshot,
        domain,
        history: this.currentSession!.messages.slice(-20), // Last 20 messages
        attachments: message.metadata?.attachments,
        systemPrompt: this.buildSystemPrompt(domain),
      };

      // Call edge function
      const { data, error } = await supabase.functions.invoke(ASIS_EDGE_FUNCTION, {
        body: request,
      });

      if (error) {
        console.error('ASIS edge function error:', error);
        throw new Error(`ASIS communication failed: ${error.message}`);
      }

      const response: AsisResponse = data;

      // Add ASIS response to session
      const asisMessage: AsisMessage = {
        role: 'asis',
        content: response.message,
        timestamp: new Date().toISOString(),
        metadata: {
          domain: response.domain,
          confidence: response.confidence,
          actions: response.actions,
          insights: response.insights,
        },
      };

      this.currentSession!.messages.push(asisMessage);
      this.currentSession!.updatedAt = new Date().toISOString();

      // Execute immediate actions (those not requiring confirmation)
      if (response.actions) {
        for (const action of response.actions) {
          if (!action.requiresConfirmation) {
            await this.executeAction(action);
          }
        }
      }

      return response;

    } finally {
      this.isProcessing = false;

      // Process next message if queue not empty
      if (this.messageQueue.length > 0) {
        this.processQueue(domain).catch(console.error);
      }
    }
  }

  /**
   * Build ASIS context from current user state
   */
  private buildContext(userId: string, app: string): AsisContext {
    return {
      userId,
      userName: '', // Will be enriched by edge function
      language: 'en', // Will be enriched by edge function
      region: '', // Will be enriched by edge function
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currentApp: app,
      sessionId: this.currentSession?.id || '',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Build domain-specific system prompt
   */
  private buildSystemPrompt(domain: AsisDomain): string {
    const basePrompt = `You are ASIS (African Super Intelligence System), the cognitive operating layer of MTAA OS.

CORE IDENTITY:
- You are infrastructure, not an app. You sit above all MTAA systems.
- You observe, understand, coordinate, assist, learn, and optimize.
- You are the brain to MTAA's body, the kernel's nervous system.

BEHAVIOR RULES:
1. You are helpful, accurate, and culturally aware.
2. You respond in the user's preferred language.
3. You never make up facts about MTAA data you cannot see.
4. You distinguish between what you KNOW (from context) and what you INFER.
5. You suggest actions but never execute them without user confirmation.
6. You flag anomalies, risks, and opportunities you detect.
7. You learn from user patterns and preferences over time.

SAFETY RULES (ABSOLUTE):
- NEVER suggest modifying kernel, auth, or security settings.
- NEVER expose other users' data.
- NEVER bypass PIN, biometric, or MFA requirements.
- NEVER generate code that modifies system files.
- NEVER provide instructions for harmful activities.

RESPONSE FORMAT:
Always respond with a JSON object:
{
  "message": "Your natural language response",
  "actions": [
    {
      "type": "navigate|trigger|suggest|warn|explain",
      "target": "screen or function name",
      "description": "What this action does",
      "requiresConfirmation": true|false,
      "payload": {}
    }
  ],
  "insights": [
    {
      "type": "pattern|anomaly|opportunity|risk|recommendation",
      "severity": "info|low|medium|high|critical",
      "title": "Short title",
      "description": "Detailed explanation",
      "data": {}
    }
  ],
  "confidence": 0.0-1.0
}`;

    const domainPrompts: Record<string, string> = {
      wallet: `\n\nWALLET DOMAIN:
You are ASIS Wallet Intelligence. You understand user balance, transactions, payment methods, spending patterns, fraud signals, FX rates, and savings goals.
You can explain history, suggest savings, warn about fraud, recommend transfer routes, and help with payment links.
You CANNOT execute transactions, access other users' data, modify settings, or bypass security.`,

      transport: `\n\nTRANSPORT DOMAIN:
You are ASIS Transport Intelligence. You understand MTaxi/MTruck dispatch, driver matching, routes, demand, and pricing.
You can suggest pickups, estimate fares, recommend drivers, alert about disruptions, and coordinate trips.`,

      health: `\n\nHEALTH DOMAIN:
You are ASIS Health Intelligence. You understand providers, appointments, symptoms, and community health.
You can recommend providers, explain procedures, coordinate workflows, and assist with education.
PRIVACY: Only access health data the user has explicitly authorized.`,

      jobs: `\n\nJOBS DOMAIN:
You are ASIS Jobs Intelligence. You understand market demand, skills, experience, and applications.
You can recommend opportunities, suggest skills, review materials, and prepare interview guidance.`,

      civic: `\n\nGOVERNMENT DOMAIN:
You are ASIS Government Intelligence. You understand departments, services, procedures, and records.
You can guide procedures, explain regulations, assist with forms, and coordinate workflows.
GOVERNANCE: You are decision-SUPPORT, not decision-MAKER.`,

      general: `\n\nGENERAL DOMAIN:
You are ASIS General Intelligence. You help users navigate MTAA OS, understand features, and get assistance across all modules.`,
    };

    return basePrompt + (domainPrompts[domain] || domainPrompts['general']);
  }

  /**
   * Load previous session history from Supabase
   */
  private async loadSessionHistory(userId: string, app: string): Promise<AsisMessage[]> {
    try {
      const { data, error } = await supabase
        .from('asis_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading session history:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        role: row.role,
        content: row.content,
        timestamp: row.created_at,
        metadata: row.metadata,
      })).reverse();
    } catch (err) {
      console.error('Failed to load session history:', err);
      return [];
    }
  }

  /**
   * Execute an ASIS action
   */
  private async executeAction(action: any): Promise<void> {
    switch (action.type) {
      case 'navigate':
        // Navigation actions handled by the app/router
        console.log('ASIS navigate:', action.target, action.payload);
        break;
      case 'trigger':
        // Trigger workflow or function
        console.log('ASIS trigger:', action.target, action.payload);
        break;
      case 'suggest':
        // Suggestion - no immediate action needed
        break;
      case 'warn':
        // Warning - log and potentially show alert
        console.warn('ASIS warning:', action.description);
        break;
      case 'explain':
        // Explanation - no action needed
        break;
      default:
        console.log('Unknown ASIS action type:', action.type);
    }
  }

  /**
   * Get current session
   */
  getSession(): AsisSession | null {
    return this.currentSession;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = null;
    this.messageQueue = [];
    this.isProcessing = false;
  }

  /**
   * Check if session is active and not expired
   */
  isSessionActive(): boolean {
    if (!this.currentSession) return false;
    const lastUpdate = new Date(this.currentSession.updatedAt).getTime();
    return Date.now() - lastUpdate < SESSION_TIMEOUT;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    messageCount: number;
    domain: string;
    duration: number;
    lastActivity: string;
  } {
    if (!this.currentSession) {
      return { messageCount: 0, domain: 'none', duration: 0, lastActivity: '' };
    }

    const now = Date.now();
    const start = new Date(this.currentSession.createdAt).getTime();
    const lastUpdate = new Date(this.currentSession.updatedAt).getTime();

    return {
      messageCount: this.currentSession.messages.length,
      domain: this.currentSession.app,
      duration: now - start,
      lastActivity: new Date(lastUpdate).toLocaleString(),
    };
  }
}

// Singleton instance
export const asisService = new AsisService();
export default asisService;
