/**
 * useStreamResponse Hook
 * Manages streaming response state and UI updates
 */

import { useState, useCallback, useRef } from 'react';
import { StreamState, StreamEvent } from '../types';

export interface UseStreamResponseReturn {
  streamState: StreamState;
  startStream: (generator: AsyncGenerator<string>) => Promise<void>;
  abortStream: () => void;
  isStreaming: boolean;
}

export function useStreamResponse(): UseStreamResponseReturn {
  const [streamState, setStreamState] = useState<StreamState>({
    isActive: false,
    chunks: [],
    fullText: '',
    progress: 0,
    error: null,
    abortController: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (generator: AsyncGenerator<string>) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStreamState({
      isActive: true,
      chunks: [],
      fullText: '',
      progress: 0,
      error: null,
      abortController: controller,
    });

    try {
      const chunks: string[] = [];

      for await (const chunk of generator) {
        if (controller.signal.aborted) {
          break;
        }

        chunks.push(chunk);
        const fullText = chunks.join('');

        setStreamState((prev) => ({
          ...prev,
          chunks: [...chunks],
          fullText,
          progress: chunks.length / (chunks.length + 5), // Approximate
        }));
      }

      setStreamState((prev) => ({
        ...prev,
        isActive: false,
        progress: 1,
      }));
    } catch (error) {
      setStreamState((prev) => ({
        ...prev,
        isActive: false,
        error: error instanceof Error ? error.message : 'Stream error',
      }));
    }
  }, []);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStreamState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  return {
    streamState,
    startStream,
    abortStream,
    isStreaming: streamState.isActive,
  };
}
