export interface TerminalResult {
  command: string;
  output: string;
  error?: string;
}

export class TerminalTool {
  async execute(command: string): Promise<TerminalResult> {
    const cmd = command.trim().toLowerCase();
    let output = '';
    let error = '';

    if (cmd === 'help' || cmd === '?') {
      output = `Available commands:
  help        Show this help
  clear       Clear terminal
  ls          List modules
  status      Show system status
  version     Show ASIS version`;
    } else if (cmd === 'ls' || cmd === 'list') {
      output = 'Modules: ASIS v6, Search, Database, Terminal, Code';
    } else if (cmd === 'status') {
      output = 'ASIS v6: Online | Search: Active | Database: Connected';
    } else if (cmd === 'version') {
      output = 'ASIS v6.0.0';
    } else if (cmd === 'clear') {
      output = 'Terminal cleared.';
    } else if (cmd === '') {
      output = '';
    } else {
      error = `Command not found: ${command}. Type "help" for available commands.`;
    }

    return { command, output, error: error || undefined };
  }
}

export const terminalTool = new TerminalTool();
