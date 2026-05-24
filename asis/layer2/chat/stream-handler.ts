/**
 * ASIS Stream Handler
 * Manages streaming response delivery with chunking and abort support
 */

import { StreamConfig, StreamState, StreamEvent } from './types';

export class ASISStreamHandler {
  private _config: StreamConfig;

  constructor(config: StreamConfig) {
    this._config = config;
  }

  /**
   * Creates an async generator that yields text chunks
   * Simulates streaming behavior for now — will connect to real AI provider later
   */
  async *createStream(fullText: string): AsyncGenerator<string, void, unknown> {
    if (!this._config.enabled) {
      yield fullText;
      return;
    }

    const chunks = this._chunkText(fullText, this._config.chunkSize);
    const startTime = Date.now();

    for (const chunk of chunks) {
      // Check timeout
      if (Date.now() - startTime > this._config.maxDurationMs) {
        console.warn('[ASIS:StreamHandler] Stream timeout reached');
        break;
      }

      yield chunk;

      // Delay between chunks for natural typing effect
      if (this._config.chunkDelayMs > 0) {
        await this._delay(this._config.chunkDelayMs);
      }
    }
  }

  /**
   * Creates a stream with abort controller support
   */
  createAbortableStream(fullText: string): {
    stream: AsyncGenerator<string, void, unknown>;
    abort: () => void;
    state: StreamState;
  } {
    const abortController = new AbortController();
    const state: StreamState = {
      isActive: true,
      chunks: [],
      fullText: '',
      progress: 0,
      error: null,
      abortController,
    };

    const stream = this._runAbortableStream(fullText, abortController, state);

    return {
      stream,
      abort: () => {
        abortController.abort();
        state.isActive = false;
      },
      state,
    };
  }

  private async *_runAbortableStream(
    fullText: string,
    controller: AbortController,
    state: StreamState
  ): AsyncGenerator<string, void, unknown> {
    try {
      const chunks = this._chunkText(fullText, this._config.chunkSize);
      const startTime = Date.now();

      for (let i = 0; i < chunks.length; i++) {
        // Check abort
        if (controller.signal.aborted) {
          console.log('[ASIS:StreamHandler] Stream aborted');
          break;
        }

        // Check timeout
        if (Date.now() - startTime > this._config.maxDurationMs) {
          console.warn('[ASIS:StreamHandler] Stream timeout');
          break;
        }

        const chunk = chunks[i];
        state.chunks.push(chunk);
        state.fullText += chunk;
        state.progress = (i + 1) / chunks.length;

        yield chunk;

        if (this._config.chunkDelayMs > 0) {
          await this._delay(this._config.chunkDelayMs);
        }
      }

      state.isActive = false;
      state.progress = 1;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Stream error';
      state.isActive = false;

      if (this._config.abortOnError) {
        throw error;
      }
    }
  }

  /**
   * Simulates a real AI streaming response
   * In production, this connects to OpenAI/Anthropic/Google streaming APIs
   */
  async *simulateAIStream(prompt: string, responseText: string): AsyncGenerator<string, void, unknown> {
    // Add initial delay to simulate thinking
    await this._delay(this._config.typingIndicatorDelay || 500);

    // Stream the response
    yield* this.createStream(responseText);
  }

  private _chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];

    // Smart chunking: prefer word boundaries
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= chunkSize) {
        chunks.push(remaining);
        break;
      }

      // Find nearest word boundary
      let end = chunkSize;
      while (end > 0 && remaining[end] !== ' ' && remaining[end] !== '\n') {
        end--;
      }

      if (end === 0) end = chunkSize; // No word boundary found

      chunks.push(remaining.substring(0, end));
      remaining = remaining.substring(end).trimStart();
    }

    return chunks;
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
