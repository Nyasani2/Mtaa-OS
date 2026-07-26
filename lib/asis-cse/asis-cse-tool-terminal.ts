/**
 * ASIS CSE — Terminal Tool
 * Shell command execution for the cognitive architecture
 * Sandboxed, permission-gated, output capture
 * Wires into ActionEngine
 */

import { BaseCognitiveTool, ToolExecutionRequest } from './asis-cse-tool-types';

interface TerminalExecuteOptions {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  captureStdout?: boolean;
  captureStderr?: boolean;
}

interface TerminalExecuteResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  cwd: string;
}

interface TerminalScriptOptions {
  script: string;
  language: 'bash' | 'sh' | 'python' | 'node' | 'ruby';
  args?: string[];
  timeoutMs?: number;
}

export class TerminalTool extends BaseCognitiveTool {
  readonly name = 'terminal';
  readonly description = 'Executes shell commands and scripts in a sandboxed environment with output capture';
  readonly version = '2.0.0';
  readonly requiresNetwork = false;
  readonly requiresFilesystem = true;
  readonly sandboxed = true;

  readonly capabilities = [
    {
      name: 'execute',
      description: 'Execute a shell command and capture output',
      parameters: [
        { name: 'command', type: 'string', description: 'Shell command to execute', required: true },
        { name: 'cwd', type: 'string', description: 'Working directory', required: false, default: '.' },
        { name: 'env', type: 'object', description: 'Environment variables', required: false },
        { name: 'timeoutMs', type: 'number', description: 'Timeout in milliseconds', required: false, default: 30000 },
        { name: 'captureStdout', type: 'boolean', description: 'Capture standard output', required: false, default: true },
        { name: 'captureStderr', type: 'boolean', description: 'Capture standard error', required: false, default: true },
      ],
      returns: { type: 'object', description: 'TerminalExecuteResult with stdout, stderr, and exit code' },
    },
    {
      name: 'runScript',
      description: 'Run a script in a supported language',
      parameters: [
        { name: 'script', type: 'string', description: 'Script content to execute', required: true },
        { name: 'language', type: 'string', description: 'Script language', required: true, enum: ['bash', 'sh', 'python', 'node', 'ruby'] },
        { name: 'args', type: 'array', description: 'Command-line arguments', required: false },
        { name: 'timeoutMs', type: 'number', description: 'Timeout in milliseconds', required: false, default: 30000 },
      ],
      returns: { type: 'object', description: 'TerminalExecuteResult' },
    },
    {
      name: 'checkCommand',
      description: 'Check if a command is available in the system PATH',
      parameters: [
        { name: 'command', type: 'string', description: 'Command to check', required: true },
      ],
      returns: { type: 'boolean', description: 'True if command is available' },
    },
  ];

  readonly permissions = [
    { action: 'execute', level: 'admin', requiresApproval: true, auditLog: true },
    { action: 'runScript', level: 'admin', requiresApproval: true, auditLog: true },
    { action: 'checkCommand', level: 'read', requiresApproval: false, auditLog: false },
  ];

  private blockedCommands = [
    'rm -rf /', 'rm -rf /*', 'mkfs', 'dd if=/dev/zero', '> /dev/sda',
    ':(){ :|:& };:', 'chmod -R 777 /', 'chown -R', 'kill -9 1',
    'shutdown', 'reboot', 'halt', 'poweroff', 'init 0', 'systemctl poweroff',
    'curl | bash', 'wget | bash', 'eval $(curl', 'eval $(wget',
  ];

  private blockedPatterns = [
    /rm\s+-rf\s+\//, /mkfs\./, /dd\s+if=\/dev\/zero/,
    /:\(\)\{\s*:\|:&\s*\};:/, />\s*\/dev\/sda/,
  ];

  isAvailable(): boolean {
    try {
      // oxlint-disable-next-line no-var-requires
      return typeof require !== 'undefined' && !!require('child_process');
    } catch {
      return false;
    }
  }

  async doExecute(request: ToolExecutionRequest): Promise<any> {
    switch (request.capability) {
      case 'execute':
        return this.executeCommand(request.parameters as TerminalExecuteOptions);
      case 'runScript':
        return this.runScript(request.parameters as TerminalScriptOptions);
      case 'checkCommand':
        return this.checkCommandAvailable(request.parameters.command);
      default:
        throw new Error(`Unknown capability: ${request.capability}`);
    }
  }

  private async executeCommand(options: TerminalExecuteOptions): Promise<TerminalExecuteResult> {
    const command = options.command.trim();
    if (this.isBlocked(command)) {
      throw new Error(`Command blocked for security: ${command}`);
    }

    // oxlint-disable-next-line no-var-requires
    const { spawn } = require('child_process');
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const args = command.split(/\s+/);
      const cmd = args.shift()!;

      const child = spawn(cmd, args, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        timeout: options.timeoutMs || 30000,
      });

      let stdout = '';
      let stderr = '';

      if (options.captureStdout !== false) {
        child.stdout?.on('data', (data: Buffer) => { stdout += data.toString(); });
      }
      if (options.captureStderr !== false) {
        child.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });
      }

      child.on('close', (exitCode: number) => {
        resolve({
          command,
          exitCode: exitCode ?? 0,
          stdout: stdout.slice(0, 50000),
          stderr: stderr.slice(0, 50000),
          executionTimeMs: Date.now() - startTime,
          cwd: options.cwd || process.cwd(),
        });
      });

      child.on('error', (err: Error) => {
        reject(new Error(`Command execution failed: ${err.message}`));
      });
    });
  }

  private async runScript(options: TerminalScriptOptions): Promise<TerminalExecuteResult> {
    const interpreters: Record<string, string> = {
      bash: 'bash', sh: 'sh', python: 'python3', node: 'node', ruby: 'ruby',
    };
    const interpreter = interpreters[options.language];
    if (!interpreter) throw new Error(`Unsupported script language: ${options.language}`);

    // oxlint-disable-next-line no-var-requires
    const fs = require('fs');
    // oxlint-disable-next-line no-var-requires
    const path = require('path');
    // oxlint-disable-next-line no-var-requires
    const os = require('os');

    const tmpFile = path.join(os.tmpdir(), `asis_script_${Date.now()}.${options.language === 'python' ? 'py' : options.language === 'node' ? 'js' : options.language}`);
    fs.writeFileSync(tmpFile, options.script);

    try {
      const args = [tmpFile, ...(options.args || [])];
      const result = await this.executeCommand({
        command: `${interpreter} ${args.join(' ')}`,
        timeoutMs: options.timeoutMs,
      });
      try { fs.unlinkSync(tmpFile); } catch {}
      return result;
    } catch (err) {
      try { fs.unlinkSync(tmpFile); } catch {}
      throw err;
    }
  }

  private async checkCommandAvailable(command: string): Promise<boolean> {
    try {
      const result = await this.executeCommand({
        command: `which ${command}`,
        captureStdout: false, captureStderr: false, timeoutMs: 5000,
      });
      return result.exitCode === 0;
    } catch { return false; }
  }

  private isBlocked(command: string): boolean {
    const lower = command.toLowerCase();
    if (this.blockedCommands.some((b) => lower.includes(b.toLowerCase()))) return true;
    return this.blockedPatterns.some((p) => p.test(command));
  }
}
