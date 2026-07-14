import { browserTool, WebResult } from './tools/browser';
import { databaseTool } from './tools/database';
import { terminalTool } from './tools/terminal';
import { codeTool } from './tools/code';
import { knowledgeGraph, GraphStats } from './knowledge-graph';
import { kamosEngine } from './kamos';

export interface ASISResponse {
  text: string;
  sources: string[];
  confidence: number;
  toolUsed: string;
  learned: boolean;
}

export interface ASISState {
  isThinking: boolean;
  lastQuery: string;
  activeTool: string | null;
}

class ASISEngine {
  private state: ASISState = {
    isThinking: false,
    lastQuery: '',
    activeTool: null
  };

  private greetings = [
    'hello', 'hi', 'hey', 'greetings', 'good morning',
    'good afternoon', 'good evening', 'howdy', 'sup'
  ];

  async processQuery(query: string): Promise<ASISResponse> {
    this.state.isThinking = true;
    this.state.lastQuery = query;
    const q = query.toLowerCase().trim();

    try {
      // 1. Greeting check
      if (this.isGreeting(q)) {
        this.state.isThinking = false;
        return {
          text: this.getGreetingResponse(q),
          sources: [],
          confidence: 100,
          toolUsed: 'greeting',
          learned: false
        };
      }

      // 2. Check knowledge graph (with KAMOS scoring)
      const known = knowledgeGraph.search(query);
      if (known && known.confidence > 70 && known.verified) {
        // Use KAMOS to validate if cached answer is still good
        const kamosScore = kamosEngine.scoreKnowledgeNode(
          known.topic, known.content, known.source, known.accessCount
        );

        if (kamosScore > 50) {
          this.state.isThinking = false;
          return {
            text: known.content,
            sources: [known.source],
            confidence: known.confidence,
            toolUsed: 'knowledge_graph',
            learned: false
          };
        }
      }

      // 3. Route to appropriate tool based on intent
      const intent = this.detectIntent(q);
      this.state.activeTool = intent;

      let response: ASISResponse;

      switch (intent) {
        case 'database':
          response = await this.handleDatabaseQuery(query);
          break;
        case 'terminal':
          response = await this.handleTerminalQuery(query);
          break;
        case 'code':
          response = await this.handleCodeQuery(query);
          break;
        case 'learning_status':
          response = await this.handleLearningStatus();
          break;
        case 'supabase_connection':
          response = await this.handleSupabaseConnection();
          break;
        default:
          response = await this.handleGeneralQuery(query);
      }

      this.state.isThinking = false;
      this.state.activeTool = null;
      return response;

    } catch (error: any) {
      this.state.isThinking = false;
      this.state.activeTool = null;

      return {
        text: `I apologize, but I encountered an issue processing your request. ${
          error?.message || 'Please try rephrasing your question.'
        }`,
        sources: [],
        confidence: 0,
        toolUsed: 'error_recovery',
        learned: false
      };
    }
  }

  private detectIntent(query: string): string {
    const q = query.toLowerCase();

    if (q.includes('connect') && q.includes('supabase')) return 'supabase_connection';
    if (q.includes('database') || q.includes('table') || q.includes('sql') || q.includes('query')) return 'database';
    if (q.includes('terminal') || q.includes('command') || q.includes('shell') || q.includes('bash')) return 'terminal';
    if (q.includes('code') || q.includes('program') || q.includes('function') || q.includes('script')) return 'code';
    if ((q.includes('learn') && q.includes('so far')) || q.includes('what have you learnt')) return 'learning_status';

    return 'general';
  }

  private async handleDatabaseQuery(query: string): Promise<ASISResponse> {
    const tables = await databaseTool.listTables();
    const tableNames = tables.map(t => t.name).join(', ');

    return {
      text: `I can connect to your Supabase database. Available tables include: ${tableNames}. You can ask me to query specific tables or describe their structure.`,
      sources: ['Supabase Database'],
      confidence: 90,
      toolUsed: 'database',
      learned: false
    };
  }

  private async handleTerminalQuery(query: string): Promise<ASISResponse> {
    const cmdMatch = query.match(/(?:run|execute|type|enter)\s+(.+)/i);
    const command = cmdMatch ? cmdMatch[1] : 'help';

    const result = await terminalTool.execute(command);

    return {
      text: result.error 
        ? `❌ ${result.error}`
        : result.output || 'Command executed.',
      sources: ['ASIS Terminal'],
      confidence: 95,
      toolUsed: 'terminal',
      learned: false
    };
  }

  private async handleCodeQuery(query: string): Promise<ASISResponse> {
    const desc = query.replace(/(?:write|generate|create|code)\s+/i, '');
    const snippet = codeTool.generateCode(desc);

    return {
      text: `Here's a ${snippet.language} snippet for: ${snippet.description}\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``,
      sources: ['ASIS Code Generator'],
      confidence: 85,
      toolUsed: 'code',
      learned: false
    };
  }

  private async handleLearningStatus(): Promise<ASISResponse> {
    const stats = knowledgeGraph.getStats();
    const recent = knowledgeGraph.getRecentLearnings(5);

    let text = `I've learned ${stats.totalNodes} topics so far`;
    if (stats.verifiedNodes > 0) {
      text += ` (${stats.verifiedNodes} verified)`;
    }
    text += '.\n\n';

    if (recent.length > 0) {
      text += 'Recent learnings:\n';
      for (const node of recent) {
        text += `• ${node.topic} (${node.verified ? '✓ verified' : 'pending'})\n`;
      }
    } else {
      text += 'Ask me questions to help me learn! I store verified information from web searches.';
    }

    return {
      text,
      sources: ['ASIS Knowledge Graph'],
      confidence: 100,
      toolUsed: 'knowledge_graph',
      learned: false
    };
  }

  private async handleSupabaseConnection(): Promise<ASISResponse> {
    try {
      const tables = await databaseTool.listTables();
      const count = tables.length;

      return {
        text: `✅ I'm connected to your Supabase database. I can see ${count} tables in the public schema. I can query data, describe table structures, and help you write SQL. What would you like to know?`,
        sources: ['Supabase Connection'],
        confidence: 100,
        toolUsed: 'database',
        learned: false
      };
    } catch (e) {
      return {
        text: `I'm configured to connect to Supabase, but the connection isn't active right now. This could be because:\n1. You're not signed in\n2. The Supabase client isn't initialized\n3. Network is unavailable\n\nI can still answer questions using web search and my knowledge graph.`,
        sources: [],
        confidence: 80,
        toolUsed: 'database',
        learned: false
      };
    }
  }

  private async handleGeneralQuery(query: string): Promise<ASISResponse> {
    // Try web search
    const results = await browserTool.searchWeb(query);

    // Use KAMOS to validate each result before showing
    const validatedResults: WebResult[] = [];
    for (const result of results) {
      if (kamosEngine.validateWebResult(query, result.title, result.extract)) {
        validatedResults.push(result);
      }
    }

    if (validatedResults.length > 0) {
      const best = validatedResults[0];

      // Learn from result
      knowledgeGraph.addNode(
        query,
        best.extract,
        best.source,
        best.relevance
      );

      return {
        text: best.extract,
        sources: [`${best.source} — ${best.title}`],
        confidence: best.relevance,
        toolUsed: 'browser',
        learned: true
      };
    }

    // Fallback: check knowledge graph with lower threshold
    const known = knowledgeGraph.search(query);
    if (known) {
      return {
        text: known.content,
        sources: [known.source],
        confidence: known.confidence,
        toolUsed: 'knowledge_graph',
        learned: false
      };
    }

    // Final fallback
    return {
      text: `I don't have verified information about that topic yet. I'm connected to Wikipedia and DuckDuckGo for web search, but I couldn't find a relevant match. Try rephrasing your question or ask about something else.`,
      sources: [],
      confidence: 0,
      toolUsed: 'none',
      learned: false
    };
  }

  private isGreeting(query: string): boolean {
    return this.greetings.some(g => query.includes(g)) && query.length < 30;
  }

  private getGreetingResponse(query: string): string {
    const hour = new Date().getHours();
    let timeGreeting = 'Hello';

    if (query.includes('morning')) timeGreeting = 'Good morning';
    else if (query.includes('afternoon')) timeGreeting = 'Good afternoon';
    else if (query.includes('evening')) timeGreeting = 'Good evening';
    else if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    return `${timeGreeting}! I am ASIS, your AI assistant. I can search the web, query your database, help with code, and learn from our conversations. How can I help you today?`;
  }

  getState(): ASISState {
    return { ...this.state };
  }

  getGraphStats(): GraphStats {
    return knowledgeGraph.getStats();
  }

  exportKnowledge(): string {
    return knowledgeGraph.exportData();
  }

  importKnowledge(json: string): void {
    knowledgeGraph.importData(json);
  }
}

export const asisEngine = new ASISEngine();
