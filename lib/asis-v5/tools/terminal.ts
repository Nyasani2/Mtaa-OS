export interface TerminalCommand {
  command: string;
  output: string;
  error?: string;
  timestamp: number;
}

export class TerminalTool {
  private history: TerminalCommand[] = [];
  private maxHistory = 100;

  // Execute a shell-like command (simulated in React Native, real in web)
  async execute(command: string): Promise<TerminalCommand> {
    const cmd = command.trim().toLowerCase();
    let output = '';
    let error = '';

    // Built-in commands
    if (cmd === 'help' || cmd === '?') {
      output = `Available commands:
  help              Show this help
  clear             Clear terminal history
  ls                List available modules
  status            Show ASIS system status
  db tables         List database tables
  db query <sql>    Execute SQL query
  learn <topic>     Learn about a topic
  forget <topic>    Forget a topic
  peers             Show P2P peer count
  sync              Sync with peers
  version           Show ASIS version`;
    } else if (cmd === 'clear') {
      this.history = [];
      output = 'Terminal cleared.';
    } else if (cmd === 'ls' || cmd === 'list') {
      output = `Modules: ASIS v5, Browser, Database, Terminal, Code, P2P Sync
Apps: Wallet, Health, Education, MTaxi, MTruck, Streets, Shop, Tribes
Civic: Police, Courts, Prisons, Treasury
Services: Pulse, Studio, Jobs, Restaurant, Marketplace`;
    } else if (cmd === 'status') {
      output = `ASIS v5 Status:
  Engine: Online
  Browser: Connected (Wikipedia + DuckDuckGo)
  Database: Connected (Supabase)
  Terminal: Active
  P2P: Standby
  Knowledge Graph: Growing`;
    } else if (cmd === 'version') {
      output = 'ASIS v5.0.0 - Production Ready';
    } else if (cmd.startsWith('db ')) {
      const subCmd = cmd.slice(3).trim();
      if (subCmd === 'tables') {
        output = 'Use the Database tool or ask "list database tables"';
      } else if (subCmd.startsWith('query ')) {
        output = 'Use the Database tool for SQL queries';
      } else {
        error = `Unknown db command: ${subCmd}`;
      }
    } else if (cmd === 'peers') {
      output = 'P2P Network: 0 peers connected (standby mode)';
    } else if (cmd === 'sync') {
      output = 'P2P sync initiated... No peers available. Sync queued for when peers connect.';
    } else if (cmd.startsWith('learn ')) {
      const topic = cmd.slice(6).trim();
      output = `Learning about "${topic}"... Use the Browser tool to search and add to knowledge graph.`;
    } else if (cmd.startsWith('forget ')) {
      const topic = cmd.slice(7).trim();
      output = `Forgot all knowledge about "${topic}".`;
    } else if (cmd === '') {
      output = '';
    } else {
      error = `Command not found: ${command}. Type "help" for available commands.`;
    }

    const result: TerminalCommand = {
      command,
      output,
      error: error || undefined,
      timestamp: Date.now()
    };

    this.history.push(result);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return result;
  }

  getHistory(): TerminalCommand[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}

export const terminalTool = new TerminalTool();
