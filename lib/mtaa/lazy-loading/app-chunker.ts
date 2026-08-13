// lib/mtaa/lazy-loading/app-chunker.ts
export interface AppChunk { id: string; category: string; modules: string[]; sizeEstimateKb: number; preloadPriority: number; }

const APP_CHUNKS: AppChunk[] = [
  { id: 'core', category: 'system', modules: ['wallet','settings','notifications'], sizeEstimateKb: 250, preloadPriority: 1 },
  { id: 'transport', category: 'mobility', modules: ['mtaxi','mtruck'], sizeEstimateKb: 180, preloadPriority: 2 },
  { id: 'commerce', category: 'commerce', modules: ['shop','marketplace','jobs'], sizeEstimateKb: 220, preloadPriority: 3 },
  { id: 'social', category: 'social', modules: ['tribes','messages'], sizeEstimateKb: 150, preloadPriority: 4 },
  { id: 'civic', category: 'government', modules: ['civic','streets'], sizeEstimateKb: 200, preloadPriority: 5 },
  { id: 'learning', category: 'education', modules: ['education'], sizeEstimateKb: 160, preloadPriority: 6 },
  { id: 'health', category: 'healthcare', modules: ['health'], sizeEstimateKb: 190, preloadPriority: 7 },
];

class AppChunker {
  private loadedChunks = new Set<string>();
  getChunk(appId: string): AppChunk|undefined { return APP_CHUNKS.find((chunk: any) => chunk.modules.includes(appId)); }
  async loadChunk(chunkId: string): Promise<void> {
    if (this.loadedChunks.has(chunkId)) return;
    const chunk = APP_CHUNKS.find((c: any) => c.id === chunkId);
    if (!chunk) throw new Error(`Chunk not found: ${chunkId}`);
    console.log(`[CHUNK] Loading ${chunkId} (${chunk.sizeEstimateKb}KB)`);
    this.loadedChunks.add(chunkId);
  }
  preloadCritical(): void { APP_CHUNKS.filter((c: any) => c.preloadPriority <= 2).forEach(chunk => this.loadChunk(chunk.id)); }
  isLoaded(chunkId: string): boolean { return this.loadedChunks.has(chunkId); }
  getLoadedChunks(): string[] { return Array.from(this.loadedChunks); }
}
export const appChunker = new AppChunker();
