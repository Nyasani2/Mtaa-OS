import { useState, useCallback, useEffect } from 'react';
import { asisEngine, InferenceResult } from '../engine';
import { voiceEngine } from '../voice';
import { visionEngine } from '../vision';
import { webLearner } from '../web-learner';
import { agentSwarm } from '../agents';

export interface UseAsisReturn {
  query: (text: string) => Promise<InferenceResult>;
  queryVoice: () => Promise<InferenceResult | null>;
  queryImage: (file: File) => Promise<{ analysis: any; response: InferenceResult }>;
  queryWeb: (url: string) => Promise<InferenceResult>;
  querySwarm: (text: string) => Promise<any>;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isListening: boolean;
  isLoading: boolean;
  lastResult: InferenceResult | null;
  stats: { queryCount: number; knowledgeNodes: number; memoryEntries: number };
}

export function useAsis(module: string = 'general'): UseAsisReturn {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<InferenceResult | null>(null);
  const [stats, setStats] = useState({ queryCount: 0, knowledgeNodes: 0, memoryEntries: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(asisEngine.getStats());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const query = useCallback(async (text: string) => {
    setIsLoading(true);
    const result = await asisEngine.infer(text, {
      module,
      userId: '',
      sessionId: '',
      previousQueries: [],
      intent: 'general',
      entities: {},
    });
    setLastResult(result);
    setIsLoading(false);
    return result;
  }, [module]);

  const queryVoice = useCallback(async () => {
    if (!voiceEngine.isSupported()) {
      return null;
    }
    setIsListening(true);
    return new Promise<InferenceResult | null>((resolve) => {
      voiceEngine.startListening(
        async (text) => {
          setIsListening(false);
          const result = await query(text);
          resolve(result);
        },
        (error) => {
          setIsListening(false);
          resolve(null);
        }
      );
    });
  }, [query]);

  const queryImage = useCallback(async (file: File) => {
    setIsLoading(true);
    const analysis = await visionEngine.analyzeImage(file);
    const result = await asisEngine.infer(`Analyze this image: ${analysis.description}`, {
      module,
      userId: '',
      sessionId: '',
      previousQueries: [],
      intent: 'visual',
      entities: {},
    });
    setLastResult(result);
    setIsLoading(false);
    return { analysis, response: result };
  }, [module]);

  const queryWeb = useCallback(async (url: string) => {
    setIsLoading(true);
    const content = await webLearner.learnFromUrl(url);
    const result = await asisEngine.infer(
      content ? `I learned from ${content.title}: ${content.summary}` : 'Failed to fetch web content',
      { module, userId: '', sessionId: '', previousQueries: [], intent: 'learn', entities: {} }
    );
    setLastResult(result);
    setIsLoading(false);
    return result;
  }, [module]);

  const querySwarm = useCallback(async (text: string) => {
    setIsLoading(true);
    const result = await agentSwarm.dispatch(text, { module });
    setIsLoading(false);
    return result;
  }, [module]);

  const speak = useCallback((text: string) => {
    voiceEngine.speak(text);
  }, []);

  const stopSpeaking = useCallback(() => {
    voiceEngine.stopSpeaking();
  }, []);

  return {
    query,
    queryVoice,
    queryImage,
    queryWeb,
    querySwarm,
    speak,
    stopSpeaking,
    isListening,
    isLoading,
    lastResult,
    stats,
  };
}
