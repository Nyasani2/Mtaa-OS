// @ts-nocheck
/**
 * ASIS v7 React Hook
 * Main interface for ASIS intelligence in React components
 * Replaces asis-provider-v6
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import {
  ASISMessage, IntentResult, ToolOutput, SearchResult,
  ContextVector, SynthesizedResponse, ASISPersonality,
} from '../types';
import {
  createIntentRouter,
  getSearchEngine,
  getCodeExecutionEngine,
  getNLToSQLConverter,
  getKamosEngine,
  getNLGenerator,
  getShellEngine,
  fetchWeatherData,
  fetchNewsHeadlines,
} from '../engine';
import { getKnowledgeStore } from '../store/knowledge';
import { supabase } from '@/lib/supabase';

interface UseASISReturn {
  messages: ASISMessage[];
  isThinking: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  sessionStats: {
    totalQueries: number;
    avgConfidence: number;
    topIntents: string[];
  };
  personality: ASISPersonality;
  updatePersonality: (updates: Partial<ASISPersonality>) => void;
}

export function useASIS(): UseASISReturn {
  const { user } = useAuthStore();
  const userId = user?.id || 'anonymous';

  const [messages, setMessages] = useState<ASISMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [personality, setPersonality] = useState<ASISPersonality>({
    name: 'ASIS',
    greetingStyle: 'friendly',
    verbosity: 'balanced',
    humor: 0.3,
    empathy: 0.7,
    technicalDepth: 0.6,
    culturalAwareness: ['african', 'global'],
  });

  const enginesRef = useRef({
    search: getSearchEngine(),
    code: getCodeExecutionEngine(),
    sql: getNLToSQLConverter(),
    kamos: getKamosEngine(userId),
    nl: getNLGenerator(personality),
    shell: getShellEngine(),
    store: getKnowledgeStore(userId),
  });

  const [sessionStats, setSessionStats] = useState({
    totalQueries: 0,
    avgConfidence: 0,
    topIntents: [] as string[],
  });

  useEffect(() => {
    loadSessionHistory();
  }, [userId]);

  const loadSessionHistory = async () => {
    try {
      const store = enginesRef.current.store;
      const history = await store.loadSessionHistory();
      if (history.length > 0) {
        const loadedMessages: ASISMessage[] = history.map((obs: any, index: number) => ({
          id: `hist_${index}`,
          role: 'user',
          content: obs.query,
          timestamp: obs.timestamp,
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.warn('[ASIS Hook] Failed to load history:', error);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;

    setIsThinking(true);

    const userMessage: ASISMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await processQuery(text.trim(), userId, enginesRef.current, personality);

      const asisMessage: ASISMessage = {
        id: `resp_${Date.now()}`,
        role: 'asis',
        content: response.text,
        timestamp: Date.now(),
        intent: response.intent,
        toolOutputs: response.toolOutputs,
        sources: response.sources,
        relatedQuestions: response.followUpSuggestions,
      };

      setMessages(prev => [...prev, asisMessage]);

      setSessionStats(prev => ({
        totalQueries: prev.totalQueries + 1,
        avgConfidence: (prev.avgConfidence * prev.totalQueries + response.confidence) / (prev.totalQueries + 1),
        topIntents: [...prev.topIntents, response.intent?.category || 'unknown'],
      }));

      await enginesRef.current.store.appendSessionHistory({
        query: text,
        parsedIntent: response.intent || { category: 'unknown', confidence: 0, entities: [], urgency: 0, requiresTools: [], suggestedActions: [] },
        toolResults: response.toolOutputs || [],
        timestamp: Date.now(),
      });

    } catch (error: any) {
      const errorMessage: ASISMessage = {
        id: `err_${Date.now()}`,
        role: 'asis',
        content: `I encountered an error: ${error.message}. Please try again.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [isThinking, userId, personality]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionStats({ totalQueries: 0, avgConfidence: 0, topIntents: [] });
  }, []);

  const updatePersonality = useCallback((updates: Partial<ASISPersonality>) => {
    setPersonality(prev => ({ ...prev, ...updates }));
    enginesRef.current.nl = getNLGenerator({ ...personality, ...updates });
  }, [personality]);

  return {
    messages,
    isThinking,
    sendMessage,
    clearChat,
    sessionStats,
    personality,
    updatePersonality,
  };
}

interface ProcessResult {
  text: string;
  confidence: number;
  intent?: IntentResult;
  toolOutputs?: ToolOutput[];
  sources?: any[];
  followUpSuggestions?: string[];
}

async function processQuery(
  query: string,
  userId: string,
  engines: any,
  personality: ASISPersonality
): Promise<ProcessResult> {
  const { search, code, sql, kamos, nl, shell, store } = engines;

  const context: ContextVector = {
    timeOfDay: getTimeOfDay(),
    dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    recentApps: [],
    recentQueries: [],
    deviceState: {
      batteryLevel: 0.5,
      isCharging: false,
      storageUsed: 0,
      storageTotal: 1,
      osVersion: '1.0',
      appVersion: '1.0',
    },
    networkState: {
      type: 'WIFI',
      isConnected: true,
      isInternetReachable: true,
    },
  };

  const knowledgeGraph = await store.loadKnowledgeGraph();
  const collectivePatterns = await store.loadCollectivePatterns();

  const kamosState = {
    userKnowledgeGraph: knowledgeGraph || {
      userId,
      facts: [],
      preferences: [],
      interactionHistory: [],
      lastUpdated: Date.now(),
    },
    collectivePatterns: collectivePatterns || [],
    contextVector: context,
    newObservation: {
      query,
      parsedIntent: { category: 'unknown', confidence: 0, entities: [], urgency: 0, requiresTools: [], suggestedActions: [] },
      toolResults: [],
      timestamp: Date.now(),
    },
  };

  const intentRouter = createIntentRouter(context, kamosState as any);
  const intent = intentRouter.classify(query);

  const toolOutputs: ToolOutput[] = [];
  const searchResults: SearchResult[] = [];

  for (const toolType of intent.requiresTools) {
    try {
      const output = await executeTool(toolType, query, intent, userId, engines);
      if (output) {
        toolOutputs.push(output);
        if (toolType === 'search' && output.data) {
          searchResults.push(...(output.data.results || []));
        }
      }
    } catch (error: any) {
      toolOutputs.push({
        tool: toolType,
        success: false,
        data: null,
        error: error.message,
        executionTime: 0,
      });
    }
  }

  const synthesized = kamos.synthesize(query, intent, toolOutputs, searchResults);
  const generatedText = nl.generate(synthesized, intent.category, context);
  const followUps = nl.generateFollowUps(intent.category, context);

  await store.saveKnowledgeGraph(kamos.getKamosState().userKnowledgeGraph);
  await store.saveCollectivePatterns(kamos.getKamosState().collectivePatterns);

  return {
    text: generatedText,
    confidence: synthesized.confidence,
    intent,
    toolOutputs,
    sources: synthesized.sources,
    followUpSuggestions: followUps,
  };
}

async function executeTool(
  toolType: string,
  query: string,
  intent: IntentResult,
  userId: string,
  engines: any
): Promise<ToolOutput | null> {
  const startTime = Date.now();

  switch (toolType) {
    case 'search': {
      const results = await engines.search.search({
        query,
        intent: intent.category,
        entities: intent.entities,
      });
      return {
        tool: 'search',
        success: true,
        data: { results, count: results.length },
        executionTime: Date.now() - startTime,
      };
    }

    case 'weather_parse': {
      const location = intent.entities.find((e: any) => e.type === 'location')?.value || 'Nairobi';
      const weather = await fetchWeatherData(location);
      return {
        tool: 'weather_parse',
        success: !!weather,
        data: weather,
        executionTime: Date.now() - startTime,
      };
    }

    case 'news_rss': {
      const headlines = await fetchNewsHeadlines('general', 'africa');
      return {
        tool: 'news_rss',
        success: true,
        data: { headlines },
        executionTime: Date.now() - startTime,
      };
    }

    case 'code_execute':
    case 'calculator': {
      const expression = query.replace(/[^0-9+\-*/().\s]/g, '').trim();
      if (expression) {
        const result = await engines.code.quickExecute(expression);
        return {
          tool: 'code_execute',
          success: result.success,
          data: result.returnValue,
          error: result.error,
          executionTime: Date.now() - startTime,
        };
      }
      return null;
    }

    case 'database_query': {
      const sqlResult = engines.sql.convert(query, userId);
      if (sqlResult) {
        try {
          const { data, error } = await supabase.rpc('asis_execute_query', {
            query_sql: sqlResult.sql,
          });
          return {
            tool: 'database_query',
            success: !error,
            data: data || sqlResult,
            error: error?.message,
            executionTime: Date.now() - startTime,
          };
        } catch (error: any) {
          return {
            tool: 'database_query',
            success: false,
            data: sqlResult,
            error: error.message,
            executionTime: Date.now() - startTime,
          };
        }
      }
      return null;
    }

    case 'shell_command': {
      const result = await engines.shell.execute(query.replace(/run command:?\s*/i, ''));
      return {
        tool: 'shell_command',
        success: result.success,
        data: result.data,
        error: result.error,
        executionTime: Date.now() - startTime,
      };
    }

    case 'knowledge_base': {
      return {
        tool: 'knowledge_base',
        success: true,
        data: { message: 'Knowledge base query processed' },
        executionTime: Date.now() - startTime,
      };
    }

    default:
      return null;
  }
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
