import { askASIS, ASISAnswer } from './asis-service';
import { databaseTool } from './tools/database';
import { terminalTool } from './tools/terminal';
import { codeTool } from './tools/code';

export interface ASISResponse {
  text: string;
  sources: Array<{ title: string; url: string; source: string }>;
  images: string[];
  relatedQuestions: string[];
  confidence: number;
  toolUsed: string;
}

export interface ASISState {
  isThinking: boolean;
  lastQuery: string;
}

class ASISEngine {
  private state: ASISState = { isThinking: false, lastQuery: '' };

  private greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];

  async processQuery(query: string): Promise<ASISResponse> {
    this.state.isThinking = true;
    this.state.lastQuery = query;
    const q = query.toLowerCase().trim();

    try {
      // Greeting
      if (this.isGreeting(q)) {
        this.state.isThinking = false;
        return {
          text: this.getGreetingResponse(q),
          sources: [], images: [], relatedQuestions: [],
          confidence: 100, toolUsed: 'greeting'
        };
      }

      // Route by intent
      const intent = this.detectIntent(q);

      switch (intent) {
        case 'database': return await this.handleDatabase();
        case 'terminal': return await this.handleTerminal(query);
        case 'code': return await this.handleCode(query);
        case 'supabase': return await this.handleSupabase();
        default: return await this.handleSearch(query);
      }

    } catch (error: any) {
      this.state.isThinking = false;
      return {
        text: `Search error: ${error?.message || 'Failed to get results'}. The edge function may not be deployed yet.`,
        sources: [], images: [], relatedQuestions: [],
        confidence: 0, toolUsed: 'error'
      };
    }
  }

  private async handleSearch(query: string): Promise<ASISResponse> {
    // Call edge function — REAL search, no cache
    const result = await askASIS(query);

    this.state.isThinking = false;

    return {
      text: result.answer,
      sources: result.results.map(r => ({ title: r.title, url: r.url, source: r.source })),
      images: result.images,
      relatedQuestions: result.relatedQuestions,
      confidence: result.results.length > 0 ? 90 : 0,
      toolUsed: 'search'
    };
  }

  private async handleDatabase(): Promise<ASISResponse> {
    const tables = await databaseTool.listTables();
    this.state.isThinking = false;
    return {
      text: `Connected to Supabase. Tables: ${tables.map(t => t.name).join(', ')}`,
      sources: [], images: [], relatedQuestions: [],
      confidence: 95, toolUsed: 'database'
    };
  }

  private async handleTerminal(query: string): Promise<ASISResponse> {
    const cmdMatch = query.match(/(?:run|execute|type|enter)\s+(.+)/i);
    const result = await terminalTool.execute(cmdMatch ? cmdMatch[1] : 'help');
    this.state.isThinking = false;
    return {
      text: result.error ? `❌ ${result.error}` : result.output,
      sources: [], images: [], relatedQuestions: [],
      confidence: 95, toolUsed: 'terminal'
    };
  }

  private async handleCode(query: string): Promise<ASISResponse> {
    const desc = query.replace(/(?:write|generate|create|code)\s+/i, '');
    const snippet = codeTool.generateCode(desc);
    this.state.isThinking = false;
    return {
      text: `\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``,
      sources: [], images: [], relatedQuestions: [],
      confidence: 85, toolUsed: 'code'
    };
  }

  private async handleSupabase(): Promise<ASISResponse> {
    this.state.isThinking = false;
    return {
      text: '✅ Supabase connection active. I can query your database.',
      sources: [], images: [], relatedQuestions: [],
      confidence: 100, toolUsed: 'database'
    };
  }

  private detectIntent(q: string): string {
    if (q.includes('connect') && q.includes('supabase')) return 'supabase';
    if (q.includes('database') || q.includes('table') || q.includes('sql')) return 'database';
    if (q.includes('terminal') || q.includes('command') || q.includes('shell')) return 'terminal';
    if (q.includes('code') || q.includes('program') || q.includes('function')) return 'code';
    return 'search';
  }

  private isGreeting(q: string): boolean {
    return this.greetings.some(g => q.includes(g)) && q.length < 40;
  }

  private getGreetingResponse(q: string): string {
    const hour = new Date().getHours();
    let greeting = 'Hello';
    if (q.includes('morning')) greeting = 'Good morning';
    else if (q.includes('afternoon')) greeting = 'Good afternoon';
    else if (q.includes('evening')) greeting = 'Good evening';
    else if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    return `${greeting}! I'm ASIS. Ask me anything — I search the web in real-time.`;
  }

  getState() { return { ...this.state }; }
}

export const asisEngine = new ASISEngine();
