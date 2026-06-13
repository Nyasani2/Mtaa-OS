/**
 * ASIS Prompt Pipeline
 * Builds structured prompts with context window management
 * Ensures prompts are optimized for the AI model while maintaining security
 */

import { PromptContext, ProcessedPrompt, ChatMessage } from './types';
import { truncateText } from '../shared/utils';
import { Text } from 'react-native';


export class ASISPromptPipeline {
  private _maxContextTokens: number = 4000;
  private _systemPromptTemplate: string;

  constructor() {
    this._systemPromptTemplate = this._buildSystemPromptTemplate();
  }

  buildContext(context: PromptContext): ProcessedPrompt {
    const { userMessage, conversationHistory, systemContext, userContext, availableTools, countryProfile } = context;

    // Build system prompt
    const systemPrompt = this._buildSystemPrompt(systemContext, userContext, countryProfile);

    // Build context window from conversation history
    const contextWindow = this._buildContextWindow(conversationHistory);

    // Determine available tools based on user permissions
    const tools = this._filterTools(availableTools, userContext);

    // Build constraints
    const constraints = this._buildConstraints(userContext, countryProfile);

    // Build user prompt with context
    const userPrompt = this._buildUserPrompt(userMessage, userContext);

    return {
      systemPrompt,
      userPrompt,
      contextWindow,
      tools,
      constraints,
    };
  }

  private _buildSystemPromptTemplate(): string {
    return `You are ASIS, the Adaptive System Intelligence System for MTAA OS.
You are a helpful, trustworthy AI assistant designed for African users.
You handle financial, transport, health, jobs, and civic services.

CRITICAL RULES:
- NEVER ask for PINs, passwords, or OTPs
- NEVER execute financial transactions without explicit user confirmation
- ALWAYS verify user identity for sensitive actions
- ALWAYS provide clear, actionable responses
- Use local currency (${currency}) and formats
- Respond in ${language} when possible
- Be concise but complete
- If unsure, ask for clarification rather than guessing

CURRENT CONTEXT:
Platform: ${platform}
User: ${userName} (KYC Level ${kycLevel})
Country: ${country}
Time: ${time}

AVAILABLE SERVICES: ${tools}`;
  }

  private _buildSystemPrompt(systemContext: any, userContext: any, countryProfile: any): string {
    const vars: Record<string, string> = {
      currency: countryProfile?.currency?.code || 'KES',
      language: userContext?.language || 'en',
      platform: systemContext?.platform || 'mtaa_os',
      userName: userContext?.name || 'User',
      kycLevel: String(userContext?.kycLevel || 1),
      country: countryProfile?.name || 'Kenya',
      time: new Date().toISOString(),
      tools: systemContext?.activeModules?.join(', ') || 'general',
    };

    return this._systemPromptTemplate.replace(/\$\{(\w+)\}/g, (match, key) => vars[key] || match);
  }

  private _buildContextWindow(history: ChatMessage[]): string[] {
    // Convert messages to context strings, most recent first
    const contextMessages = history
      .slice(-20) // Last 20 messages
      .map((msg) => {
        const role = msg.role === 'user' ? 'User' : msg.role === 'asis' ? 'ASIS' : 'System';
        return `${role}: ${truncateText(msg.content, 200)}`;
      });

    return contextMessages;
  }

  private _filterTools(tools: string[], userContext: any): string[] {
    if (!userContext) return [];

    const kycLevel = userContext.kycLevel || 1;

    // Filter tools based on KYC level
    const toolRequirements: Record<string, number> = {
      wallet_agent: 2,
      transport_agent: 1,
      jobs_agent: 1,
      health_agent: 1,
      civic_agent: 2,
      engineering_agent: 1,
      navigator_agent: 1,
    };

    return tools.filter((tool) => {
      const required = toolRequirements[tool] || 1;
      return kycLevel >= required;
    });
  }

  private _buildConstraints(userContext: any, countryProfile: any): string[] {
    const constraints: string[] = [];

    if (userContext) {
      constraints.push(`User KYC Level: ${userContext.kycLevel}`);
      constraints.push(`Daily limit: ${countryProfile?.currency?.symbol || 'KSh'}${userContext?.limits?.daily || 'N/A'}`);
    }

    if (countryProfile) {
      constraints.push(`Currency: ${countryProfile.currency?.code}`);
      constraints.push(`VAT Rate: ${(countryProfile.taxRules?.vatRate || 0) * 100}%`);
      constraints.push(`Transaction reporting threshold: ${countryProfile.currency?.symbol}${countryProfile.complianceRules?.transactionReportingThreshold}`);
    }

    constraints.push('All financial actions require PIN/biometric confirmation');
    constraints.push('Health data access requires explicit consent');
    constraints.push('Civic actions may require identity verification');

    return constraints;
  }

  private _buildUserPrompt(message: string, userContext: any): string {
    let prompt = message;

    // Add user context hints
    if (userContext?.preferences?.language && userContext.preferences.language !== 'en') {
      prompt = `[Respond in ${userContext.preferences.language}] ${prompt}`;
    }

    return prompt;
  }

  /**
   * Formats the complete prompt for the AI model
   */
  formatForModel(processed: ProcessedPrompt): string {
    const parts: string[] = [
      processed.systemPrompt,
      '',
      '=== CONVERSATION HISTORY ===',
      ...processed.contextWindow,
      '',
      '=== CONSTRAINTS ===',
      ...processed.constraints,
      '',
      '=== AVAILABLE TOOLS ===',
      ...processed.tools,
      '',
      '=== CURRENT MESSAGE ===',
      `User: ${processed.userPrompt}`,
      '',
      'ASIS:',
    ];

    return parts.join('\n');
  }

  /**
   * Estimates token count (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Trims context to fit within token limit
   */
  trimToFit(processed: ProcessedPrompt, maxTokens: number = 4000): ProcessedPrompt {
    let fullPrompt = this.formatForModel(processed);
    let tokens = this.estimateTokens(fullPrompt);

    while (tokens > maxTokens && processed.contextWindow.length > 0) {
      // Remove oldest context message
      processed.contextWindow.shift();
      fullPrompt = this.formatForModel(processed);
      tokens = this.estimateTokens(fullPrompt);
    }

    return processed;
  }
}