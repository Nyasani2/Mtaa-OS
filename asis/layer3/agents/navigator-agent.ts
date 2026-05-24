/**
 * NavigatorAgent
 * General-purpose agent for help, routing, FAQ, and ambiguous requests
 * Acts as the default/fallback agent when no other agent matches
 */

import { BaseAgent } from './base-agent';
import { AgentRequest, AgentResponse } from '../shared/types';
import { ASISEventBus } from '../core/event-bus';
import { ASISSecurityLayer } from '../security/security-layer';
import { generateId } from '../shared/utils';

export class NavigatorAgent extends BaseAgent {
  readonly name = 'navigator_agent';
  readonly version = '1.0.0';
  readonly capabilities = [
    'general_help',
    'routing',
    'faq',
    'greeting',
    'small_talk',
    'system_info',
    'feature_discovery',
  ];

  private _faqDatabase: Map<string, string> = new Map();
  private _greetings: string[] = [
    'Hello! I am ASIS, your AI assistant. How can I help you today?',
    'Hi there! Ready to assist you with wallet, transport, jobs, health, and more.',
    'Welcome back! What would you like to do today?',
  ];

  constructor(eventBus: ASISEventBus, security: ASISSecurityLayer) {
    super(eventBus, security);
    this._initFaq();
  }

  private _initFaq(): void {
    this._faqDatabase.set('what can you do', 
      'I can help you with:

' +
      '💰 **Wallet** — Check balance, send money, pay bills, view transactions
' +
      '🚕 **Transport** — Book MTaxi rides, MTruck deliveries, track your trips
' +
      '💼 **Jobs** — Search jobs, apply, post listings, get salary estimates
' +
      '🏥 **Health** — Book appointments, find doctors, access health records
' +
      '🏛️ **Civic** — Permits, licenses, police reports, court info
' +
      '
Just tell me what you need!');

    this._faqDatabase.set('how to send money',
      'To send money:

' +
      '1. Say "Send [amount] to [person]"
' +
      '2. I will confirm the details
' +
      '3. Enter your PIN or use biometric
' +
      '4. Done!

' +
      'Example: "Send 500 KSh to John"');

    this._faqDatabase.set('how to book a ride',
      'To book a ride:

' +
      '1. Say "Book a taxi to [destination]"
' +
      '2. I will find available drivers
' +
      '3. Confirm pickup location
' +
      '4. Track your ride in real-time

' +
      'You can also book trucks for deliveries!');

    this._faqDatabase.set('how to find a job',
      'To find jobs:

' +
      '1. Say "Find me a job in [field]"
' +
      '2. I will search listings matching your profile
' +
      '3. Swipe through matches
' +
      '4. Apply with one tap

' +
      'You can also say "Jobs near me" or "Remote jobs"');

    this._faqDatabase.set('is my data safe',
      'Yes, your data is protected:

' +
      '🔒 End-to-end encryption for messages
' +
      '🔐 PIN/biometric for all financial actions
' +
      '📋 Full audit trail for transparency
' +
      '🏛️ Compliant with CBK regulations
' +
      '🌍 Data stays in Kenya

' +
      'You own your data. You can export or delete it anytime.');

    this._faqDatabase.set('what is kyc',
      'KYC (Know Your Customer) verifies your identity:

' +
      '**Tier 1** — Phone verified (limit: KSh 300,000)
' +
      '**Tier 2** — ID + address (limit: KSh 1,000,000)
' +
      '**Tier 3** — Full verification (unlimited)

' +
      'Higher tiers unlock more features. Verify in Settings > Identity.');

    this._faqDatabase.set('how to contact support',
      'Need human help?

' +
      '📞 Call: 0800-ASIS-HELP
' +
      '💬 In-app: Settings > Support > Chat
' +
      '📧 Email: support@mtaa.africa

' +
      'For emergencies, use the SOS button in your profile.');
  }

  protected _registerTools(): void {
    // Navigator uses no external tools — it's purely conversational
    this._tools.set('get_capabilities', {
      name: 'get_capabilities',
      description: 'List all available ASIS capabilities',
      parameters: [],
      returns: { type: 'array', description: 'List of capabilities' },
      requiresAuth: false,
      riskLevel: 'low',
    });
  }

  canHandle(intent: string, entities: string[]): boolean {
    // Navigator handles general, help, greeting, and unknown intents
    const navigatorIntents = ['general', 'help', 'greeting', 'faq', 'unknown', 'small_talk'];
    return navigatorIntents.includes(intent) || entities.length === 0;
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const validation = this._validateRequest(request);

    if (!validation.valid) {
      return this._createErrorResponse(validation.error || 'Invalid request');
    }

    this._state.status = 'processing';
    const { input, context } = request;
    const lowerInput = input.toLowerCase().trim();

    try {
      let response: AgentResponse;

      // Check for greetings
      if (this._isGreeting(lowerInput)) {
        response = this._handleGreeting(context);
      }
      // Check FAQ
      else if (this._isFaq(lowerInput)) {
        response = this._handleFaq(lowerInput);
      }
      // Check for help request
      else if (this._isHelpRequest(lowerInput)) {
        response = this._handleHelpRequest(context);
      }
      // Check for system info
      else if (this._isSystemInfoRequest(lowerInput)) {
        response = this._handleSystemInfo(context);
      }
      // Default: friendly redirect
      else {
        response = this._handleDefault(input, context);
      }

      this._updateMetrics(Date.now() - startTime);
      this._state.status = 'idle';
      return response;
    } catch (error) {
      this._state.status = 'error';
      return this._createErrorResponse(
        error instanceof Error ? error.message : 'Navigation failed'
      );
    }
  }

  private _isGreeting(input: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'sup', 'howdy'];
    return greetings.some((g) => input.includes(g));
  }

  private _isFaq(input: string): boolean {
    for (const key of this._faqDatabase.keys()) {
      if (input.includes(key)) return true;
    }
    return input.includes('?') && input.length < 100;
  }

  private _isHelpRequest(input: string): boolean {
    const helpPatterns = ['help', 'how do i', 'how to', 'what is', 'explain', 'tell me about'];
    return helpPatterns.some((p) => input.includes(p));
  }

  private _isSystemInfoRequest(input: string): boolean {
    const infoPatterns = ['version', 'status', 'health', 'uptime', 'modules', 'capabilities'];
    return infoPatterns.some((p) => input.includes(p));
  }

  private _handleGreeting(context: any): AgentResponse {
    const userName = context?.user?.name || 'there';
    const hour = new Date().getHours();
    let timeGreeting = 'Hello';

    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    const greeting = `${timeGreeting}, ${userName}! ${this._greetings[Math.floor(Math.random() * this._greetings.length)]}`;

    return this._createTextResponse(greeting, { type: 'greeting' });
  }

  private _handleFaq(input: string): AgentResponse {
    // Find best matching FAQ
    let bestMatch: { key: string; score: number } | null = null;

    for (const key of this._faqDatabase.keys()) {
      const score = this._calculateSimilarity(input, key);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { key, score };
      }
    }

    if (bestMatch && bestMatch.score > 0.3) {
      const answer = this._faqDatabase.get(bestMatch.key)!;
      return this._createTextResponse(answer, { type: 'faq', matchedQuestion: bestMatch.key });
    }

    return this._createTextResponse(
      'I am not sure about that. Here is what I can help with:

' +
      '• Wallet (send money, check balance, pay bills)
' +
      '• Transport (book rides, track deliveries)
' +
      '• Jobs (search, apply, post listings)
' +
      '• Health (appointments, find doctors)
' +
      '• Civic (permits, licenses, reports)

' +
      'What would you like to do?',
      { type: 'faq_not_found' }
    );
  }

  private _handleHelpRequest(context: any): AgentResponse {
    const userName = context?.user?.name || 'there';

    return this._createActionResponse(
      `Hi ${userName}! I am here to help. What do you need assistance with?`,
      [
        { label: '💰 Wallet', type: 'navigate', payload: { route: 'wallet' } },
        { label: '🚕 Transport', type: 'navigate', payload: { route: 'transport' } },
        { label: '💼 Jobs', type: 'navigate', payload: { route: 'jobs' } },
        { label: '🏥 Health', type: 'navigate', payload: { route: 'health' } },
        { label: '🏛️ Civic', type: 'navigate', payload: { route: 'civic' } },
        { label: '❓ FAQ', type: 'navigate', payload: { route: 'faq' } },
      ],
      { type: 'help_menu' }
    );
  }

  private _handleSystemInfo(context: any): AgentResponse {
    const systemContext = context?.system;

    return this._createTextResponse(
      `**ASIS System Status**\n\n` +
      `Platform: ${systemContext?.platform || 'mtaa_os'}\n` +
      `Version: ${systemContext?.version || '1.0.0'}\n` +
      `Environment: ${systemContext?.environment || 'production'}\n` +
      `Active Modules: ${systemContext?.activeModules?.join(', ') || 'None'}\n` +
      `Network: ${systemContext?.networkStatus || 'unknown'}\n\n` +
      `All systems operational.`,
      { type: 'system_info' }
    );
  }

  private _handleDefault(input: string, context: any): AgentResponse {
    // Try to detect intent and suggest the right agent
    const detectedIntent = this._detectIntent(input);

    if (detectedIntent) {
      return this._createActionResponse(
        `It sounds like you want help with **${detectedIntent}**. Should I connect you to the right assistant?`,
        [
          { label: `Yes, open ${detectedIntent}`, type: 'navigate', payload: { route: detectedIntent } },
          { label: 'No, keep chatting', type: 'cancel', payload: {} },
        ],
        { type: 'intent_suggestion', detectedIntent }
      );
    }

    return this._createTextResponse(
      `I am not sure I understood that. Could you rephrase or tell me more about what you need?\n\n` +
      `You can say things like:
` +
      `• "Send 500 KSh to Mom"\n` +
      `• "Book a taxi to Westlands"\n` +
      `• "Find me a software job"\n` +
      `• "Book a doctor appointment"`,
      { type: 'clarification' }
    );
  }

  private _detectIntent(input: string): string | null {
    const intentMap: Record<string, string[]> = {
      wallet: ['money', 'send', 'pay', 'balance', 'transfer', 'withdraw', 'deposit'],
      transport: ['taxi', 'ride', 'truck', 'delivery', 'pickup', 'driver'],
      jobs: ['job', 'work', 'hire', 'salary', 'cv', 'resume', 'employment'],
      health: ['doctor', 'hospital', 'clinic', 'appointment', 'symptom', 'medicine'],
      civic: ['police', 'court', 'permit', 'license', 'government', 'report'],
    };

    const lowerInput = input.toLowerCase();
    for (const [intent, keywords] of Object.entries(intentMap)) {
      if (keywords.some((k) => lowerInput.includes(k))) {
        return intent;
      }
    }
    return null;
  }

  private _calculateSimilarity(a: string, b: string): number {
    // Simple Jaccard similarity for FAQ matching
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }
}
