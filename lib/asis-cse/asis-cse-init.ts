// @ts-nocheck
/**
 * ASIS CSE — Initialization & System Bootstrap
 */

import { globalToolRegistry } from './asis-cse-tool-registry';
import { BrowserTool } from './asis-cse-tool-browser';
import { CodeTool } from './asis-cse-tool-code';
import { TerminalTool } from './asis-cse-tool-terminal';
import type { 
  ASISMessage, 
  ASISMetrics, 
  ASISClock, 
  ASISDiagnostic, 
  ASISToolRegistry, 
  ASISEventBus, 
  ASISMemory, 
  ASISKnowledge, 
  CognitiveState,
  ResponseEngineInput,
  ASISInitConfig
} from './asis-cse-types';
import { processResponse } from './asis-cse-response-engine-v2';

export interface ASISSystem {
  readonly id: string;
  readonly config: ASISInitConfig;
  readonly metrics: ASISMetrics;
  readonly clock: ASISClock;
  readonly diagnostic: ASISDiagnostic;
  readonly toolRegistry: ASISToolRegistry;
  readonly eventBus: ASISEventBus;
  readonly memory: ASISMemory;
  readonly knowledge: ASISKnowledge;
  send(message: string): Promise<ASISMessage>;
  process(input: string): Promise<any>;
  getHistory(): ASISMessage[];
  getState(): Partial<CognitiveState>;
  clearHistory(): void;
  destroy(): void;
}

let activeInstance: ASISSystem | null = null;
let globalCycleCounter = 0;

export function initializeASIS(config: ASISInitConfig = {}): ASISSystem {
  if (activeInstance) activeInstance.destroy();

  const instanceId = `asis-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const history: ASISMessage[] = [];
  const eventLog: { name: string; value?: number; time: number }[] = [];
  const diagLogs: { level: string; message: string; time: number }[] = [];
  const tools: Map<string, any> = new Map();
  const eventHistory: any[] = [];
  const memoryStore: Map<string, any> = new Map();
  const knowledgeBase: { fact: string; source: string; time: number }[] = [];
  const subscribers: Map<string, ((event: any) => void)[]> = new Map();

  history.push({
    id: `sys-${Date.now()}`,
    role: 'system',
    content: 'ASIS CSE v2 online. How can I assist you today?',
    timestamp: Date.now(),
  });

  const metrics: ASISMetrics = {
    generateReport(): string {
      const totalEvents = eventLog.length;
      const avgLatency = totalEvents > 0 ? eventLog.reduce((s, e) => s + (e.value || 0), 0) / totalEvents : 0;
      return `ASIS Metrics Report\nInstance: ${instanceId}\nMessages: ${history.length}\nEvents: ${totalEvents}\nAvg Latency: ${avgLatency.toFixed(2)}ms\nStatus: Active`;
    },
    recordEvent(name: string, value?: number): void { eventLog.push({ name, value, time: Date.now() }); },
    getStats(): Record<string, any> { return { instanceId, messageCount: history.length, eventCount: eventLog.length }; },
  };

  const clock: ASISClock = {
    getTimingReport(): string {
      const now = new Date();
      return `ASIS Clock Report\nSystem Time: ${now.toISOString()}\nLocal Time: ${now.toLocaleString()}\nEpoch: ${now.getTime()}\nCycle: ${globalCycleCounter}`;
    },
    getTimestamp(): number { return Date.now(); },
    getCycleNumber(): number { return ++globalCycleCounter; },
  };

  const diagnostic: ASISDiagnostic = {
    generateReport(): string {
      const recent = diagLogs.slice(-5);
      return `ASIS Diagnostic Report\nInstance: ${instanceId}\nTotal Logs: ${diagLogs.length}\n` + (recent.length > 0 ? recent.map((l: any) => `  [${l.level.toUpperCase()}] ${l.message}`).join('\n') : '  No diagnostic events recorded.');
    },
    log(level: 'info' | 'warn' | 'error', message: string): void { diagLogs.push({ level, message, time: Date.now() }); },
    getLogs(): string[] { return diagLogs.map((l: any) => `[${l.level.toUpperCase()}] ${l.message}`); },
  };

  const toolRegistry: ASISToolRegistry = {
    generateHealthReport(): string { return `ASIS Tool Registry Health\nInstance: ${instanceId}\nRegistered Tools: ${tools.size}\nStatus: Operational`; },
    registerTool(name: string, tool: any): void { tools.set(name, tool); },
    getToolCount(): number { return tools.size; },
  };

  const eventBus: ASISEventBus = {
    publish(event: { type: string; payload?: any; source?: string }): void {
      const enriched = { ...event, timestamp: Date.now(), instanceId };
      eventHistory.push(enriched);
      (subscribers.get(event.type) || []).forEach(h => { try { h(enriched); } catch {} });
    },
    subscribe(type: string, handler: (event: any) => void): () => void {
      if (!subscribers.has(type)) subscribers.set(type, []);
      subscribers.get(type)!.push(handler);
      return () => { const list = subscribers.get(type) || []; const idx = list.indexOf(handler); if (idx > -1) list.splice(idx, 1); };
    },
    getHistory(): any[] { return [...eventHistory]; },
  };

  const memory: ASISMemory = {
    store(key: string, value: any): void { memoryStore.set(key, { value, time: Date.now() }); },
    retrieve(key: string): any { return memoryStore.get(key)?.value ?? null; },
    getStats(): Record<string, any> { return { entries: memoryStore.size }; },
  };

  const knowledge: ASISKnowledge = {
    query(topic: string): any[] {
      const lower = topic.toLowerCase();
      return knowledgeBase.filter((k: any) => k.fact.toLowerCase().includes(lower));
    },
    addFact(fact: string, source?: string): void { knowledgeBase.push({ fact, source: source || 'unknown', time: Date.now() }); },
    getStats(): Record<string, any> { return { facts: knowledgeBase.length }; },
  };

  const system: ASISSystem = {
    id: instanceId, config, metrics, clock, diagnostic, toolRegistry, eventBus, memory, knowledge,
    async send(message: string): Promise<ASISMessage> {
      const startTime = Date.now();
      const cycle = clock.getCycleNumber();
      diagnostic.log('info', `[Cycle ${cycle}] Processing: ${message.slice(0, 50)}...`);
      history.push({ id: `usr-${startTime}`, role: 'user', content: message, timestamp: startTime });

      let responseContent: string;
      let metadata: Record<string, any> = { cycle };
      try {
        const response = await processResponse({ query: message, conversationTurn: history.length });
        responseContent = response.text;
        metadata = { ...metadata, pipeline: 'v2-response-engine', latency: response.latencyMs, tone: response.tone, sources: response.sources };
      } catch (e: any) {
        diagnostic.log('warn', `V2 pipeline failed: ${e?.message || 'unknown'}`);
        responseContent = generateLocalResponse(message);
        metadata = { ...metadata, pipeline: 'local-fallback' };
      }

      const endTime = Date.now();
      metrics.recordEvent('message_processed', endTime - startTime);
      const asisMsg: ASISMessage = { id: `asis-${endTime}`, role: 'asis', content: responseContent, timestamp: endTime, metadata };
      history.push(asisMsg);
      eventBus.publish({ type: 'MESSAGE_PROCESSED', payload: { latency: endTime - startTime, cycle }, source: 'ASISProvider' });
      return asisMsg;
    },
    async process(input: string): Promise<any> { return this.send(input); },
    getHistory(): ASISMessage[] { return [...history]; },
    getState(): Partial<CognitiveState> { return { status: 'active', context: config.context || 'mobile', messageCount: history.length }; },
    clearHistory(): void { history.length = 0; },
    destroy(): void { if (activeInstance?.id === instanceId) activeInstance = null; },
  };

  // Register core JARVIS tools with the central execution gateway
  globalToolRegistry.registerTool(new BrowserTool());
  globalToolRegistry.registerTool(new CodeTool());
  globalToolRegistry.registerTool(new TerminalTool());

  activeInstance = system;
  diagnostic.log('info', `ASIS instance ${instanceId} initialized`);
  return system;
}

export function getActiveASIS(): ASISSystem | null { return activeInstance; }
export function getASISHealth(): string {
  if (!activeInstance) return `ASIS Health Report\nStatus: Offline\nInstance: None\nRecommendation: Initialize ASIS.`;
  const state = activeInstance.getState();
  return `ASIS Health Report\nStatus: ${state.status || 'Unknown'}\nInstance: ${activeInstance.id}\nMessages: ${state.messageCount || 0}\nOverall: Healthy`;
}
export function shutdownASIS(): void { if (activeInstance) activeInstance.destroy(); activeInstance = null; }

function generateLocalResponse(message: string): string {
  const lower = message.toLowerCase().trim();
  if (/^(hi|hello|hey|greetings)/.test(lower)) return `Hello! I'm ASIS, your cognitive operating system. How can I help?`;
  if (/^(bye|goodbye|see you)/.test(lower)) return `Goodbye. I'll remain active in standby mode.`;
  if (/what day|what date|what time|current time/.test(lower)) {
    const now = new Date();
    return `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Local time: ${now.toLocaleTimeString('en-US')}.`;
  }
  const mathMatch = lower.match(/(?:calculate|compute|what is|solve)?\s*([\d\s+\-*/().^]+)/);
  if (mathMatch && /[\d]/.test(mathMatch[1]) && /[\+\-*/]/.test(mathMatch[1])) {
    try {
      const expr = mathMatch[1].replace(/\s+/g, '').replace(/\^/g, '**');
      if (/^[\d+\-*/().**]+$/.test(expr)) return `The result is ${Function('"use strict"; return (' + expr + ')')()}.`;
    } catch {}
  }
  if (/who are you|what are you/.test(lower)) return `I am ASIS — the Artificial Sentience Intelligence System, built on Kamos Theory.`;
  if (/help|what can you do/.test(lower)) return `I can research topics, calculate, tell time, and answer questions. What would you like to explore?`;
  if (/mtaa|kamos theory/.test(lower)) return `MTAA is the Multi-Terrain Adaptive Architecture — a cognitive OS built on Kamos Theory (1×1 = 1 + f).`;
  if (/thank|thanks/.test(lower)) return `You're welcome. I'm here whenever you need assistance.`;
  return `I don't have that specific information. Try asking about people, places, science, history, or math.`;
}
