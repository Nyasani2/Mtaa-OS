/**
 * ASIS v7 Shell Engine
 * Executes system commands and terminal operations
 * Safe execution with allowlist
 * Kamos Theory: shell commands = direct system interaction
 */

import { ToolOutput } from '../types';

// ─── Safe Command Allowlist ─────────────────────────────────────

interface CommandDefinition {
  command: string;
  description: string;
  safe: boolean;
  maxOutputLength: number;
}

const ALLOWED_COMMANDS: CommandDefinition[] = [
  { command: 'ls', description: 'List files', safe: true, maxOutputLength: 5000 },
  { command: 'pwd', description: 'Print working directory', safe: true, maxOutputLength: 100 },
  { command: 'cat', description: 'Display file contents', safe: true, maxOutputLength: 10000 },
  { command: 'echo', description: 'Print text', safe: true, maxOutputLength: 1000 },
  { command: 'date', description: 'Show current date/time', safe: true, maxOutputLength: 100 },
  { command: 'whoami', description: 'Show current user', safe: true, maxOutputLength: 100 },
  { command: 'uname', description: 'System information', safe: true, maxOutputLength: 500 },
  { command: 'df', description: 'Disk space', safe: true, maxOutputLength: 1000 },
  { command: 'du', description: 'Directory size', safe: true, maxOutputLength: 2000 },
  { command: 'ps', description: 'Process list', safe: true, maxOutputLength: 5000 },
  { command: 'top', description: 'System processes', safe: true, maxOutputLength: 3000 },
  { command: 'env', description: 'Environment variables', safe: true, maxOutputLength: 3000 },
  { command: 'node', description: 'Node.js execution', safe: true, maxOutputLength: 5000 },
  { command: 'npm', description: 'NPM commands', safe: true, maxOutputLength: 3000 },
  { command: 'npx', description: 'NPX execution', safe: true, maxOutputLength: 5000 },
  { command: 'git', description: 'Git commands', safe: true, maxOutputLength: 5000 },
  { command: 'curl', description: 'HTTP requests', safe: true, maxOutputLength: 10000 },
  { command: 'ping', description: 'Network ping', safe: true, maxOutputLength: 1000 },
  { command: 'traceroute', description: 'Network trace', safe: true, maxOutputLength: 2000 },
];

// ─── Dangerous Command Blocklist ────────────────────────────────

const BLOCKED_PATTERNS = [
  /rm\s+-rf/i,
  />\s*\//i,
  /dd\s+if/i,
  /mkfs/i,
  /fdisk/i,
  /format/i,
  /del\s+\//i,
  /rmdir\s+\//i,
  /sudo/i,
  /su\s+-/i,
  /chmod\s+777/i,
  /wget.*\|.*sh/i,
  /curl.*\|.*sh/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
  /system\s*\(/i,
  /\.\.\//,
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
];

// ─── Shell Engine ───────────────────────────────────────────────

export class ShellEngine {
  private commandHistory: string[] = [];
  private maxHistory: number = 100;

  /**
   * Validate if command is safe to execute
   */
  validateCommand(command: string): { safe: boolean; reason?: string } {
    const trimmed = command.trim();

    // Check blocklist
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { safe: false, reason: 'Command matches dangerous pattern' };
      }
    }

    // Check if command is in allowlist
    const baseCommand = trimmed.split(/\s+/)[0];
    const allowed = ALLOWED_COMMANDS.find(cmd => cmd.command === baseCommand);

    if (!allowed) {
      return { safe: false, reason: `Command '${baseCommand}' is not in the safe command list` };
    }

    return { safe: true };
  }

  /**
   * Execute shell command (simulated in React Native)
   * In production, this would use a native module or edge function
   */
  async execute(command: string): Promise<ToolOutput> {
    const startTime = Date.now();

    // Validate
    const validation = this.validateCommand(command);
    if (!validation.safe) {
      return {
        tool: 'shell_command',
        success: false,
        data: null,
        error: validation.reason,
        executionTime: Date.now() - startTime,
      };
    }

    // Record in history
    this.commandHistory.push(command);
    if (this.commandHistory.length > this.maxHistory) {
      this.commandHistory = this.commandHistory.slice(-this.maxHistory);
    }

    try {
      // For React Native, we simulate shell execution
      // In production, use a native module or Supabase edge function
      const result = await this.simulateExecution(command);

      return {
        tool: 'shell_command',
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        tool: 'shell_command',
        success: false,
        data: null,
        error: error.message || 'Execution failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Simulate command execution
   * In production, replace with actual shell execution
   */
  private async simulateExecution(command: string): Promise<string> {
    const baseCommand = command.trim().split(/\s+/)[0];
    const args = command.trim().split(/\s+/).slice(1);

    switch (baseCommand) {
      case 'date':
        return new Date().toString();

      case 'pwd':
        return '/home/user/MTAA_OS';

      case 'whoami':
        return 'mtaa-user';

      case 'uname':
        return 'MTAA OS v1.0.0 (Linux Kernel 5.15)';

      case 'echo':
        return args.join(' ');

      case 'env':
        return `PATH=/usr/local/bin:/usr/bin:/bin
HOME=/home/user
USER=mtaa-user
SHELL=/bin/bash
MTAA_OS_VERSION=1.0.0`;

      case 'ls':
        return `total 128
drwxr-xr-x  2 user user 4096 Jul 21 07:00 appstore
drwxr-xr-x  2 user user 4096 Jul 21 07:00 asis
drwxr-xr-x  2 user user 4096 Jul 21 07:00 health
drwxr-xr-x  2 user user 4096 Jul 21 07:00 wallet
drwxr-xr-x  2 user user 4096 Jul 21 07:00 settings
drwxr-xr-x  2 user user 4096 Jul 21 07:00 streets
drwxr-xr-x  2 user user 4096 Jul 21 07:00 education
drwxr-xr-x  2 user user 4096 Jul 21 07:00 mtaxi
drwxr-xr-x  2 user user 4096 Jul 21 07:00 mtruck`;

      case 'df':
        return `Filesystem     1K-blocks     Used Available Use% Mounted on
/dev/sda1      500000000 200000000 300000000  40% /
tmpfs           8000000    500000   7500000   7% /tmp`;

      case 'ps':
        return `  PID TTY          TIME CMD
    1 ?        00:00:01 systemd
  500 ?        00:00:05 node
  501 ?        00:00:02 expo
  600 ?        00:00:01 postgres
  700 ?        00:00:03 redis-server`;

      case 'git':
        if (args[0] === 'status') {
          return `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`;
        }
        if (args[0] === 'log') {
          return `commit abc1234
Author: MTAA Developer <dev@mtaa.io>
Date:   Jul 21 2026

    ASIS v7 intelligence engine

commit def5678
Author: MTAA Developer <dev@mtaa.io>
Date:   Jul 20 2026

    Settings v4 comprehensive update`;
        }
        return `git version 2.40.0`;

      case 'node':
        if (args.includes('--version') || args.includes('-v')) {
          return 'v20.0.0';
        }
        return 'Node.js execution requires a script file.';

      case 'npm':
        if (args[0] === '--version' || args[0] === '-v') {
          return '10.0.0';
        }
        return `mtaa-os@1.0.0 /home/user/MTAA_OS
├── expo@52.0.46
├── react@18.3.1
├── react-native@0.76.9
├── supabase-js@2.105.4
└── zustand@5.0.14`;

      case 'curl':
        return `HTTP/1.1 200 OK
Content-Type: application/json

{"status": "ok", "message": "MTAA OS API is running"}`;

      case 'ping':
        return `PING google.com (142.250.80.46) 56(84) bytes of data.
64 bytes from google.com: icmp_seq=1 ttl=117 time=15.2 ms
64 bytes from google.com: icmp_seq=2 ttl=117 time=14.8 ms

--- google.com ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1001ms
rtt min/avg/max/mdev = 14.8/15.0/15.2/0.2 ms`;

      default:
        return `Command '${baseCommand}' executed successfully. (Simulated output)`;
    }
  }

  /**
   * Get command history
   */
  getHistory(): string[] {
    return [...this.commandHistory];
  }

  /**
   * Get available commands
   */
  getAvailableCommands(): CommandDefinition[] {
    return [...ALLOWED_COMMANDS];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.commandHistory = [];
  }
}

// ─── Singleton Instance ─────────────────────────────────────────

let shellInstance: ShellEngine | null = null;

export function getShellEngine(): ShellEngine {
  if (!shellInstance) {
    shellInstance = new ShellEngine();
  }
  return shellInstance;
}
