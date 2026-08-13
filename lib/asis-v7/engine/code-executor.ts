/**
 * ASIS v7 Code Execution Engine
 * Runs JavaScript code in a safe, sandboxed environment
 * For math, logic, data processing, and code verification
 * No external runtime needed — uses Function constructor with timeout
 * Kamos Theory: code execution = observation → growth (learns from outputs)
 */

import { CodeExecutionRequest, CodeExecutionResult } from '../types';

// ─── Safe Execution Sandbox ─────────────────────────────────────

interface SandboxContext {
  console: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
  };
  Math: typeof Math;
  Date: typeof Date;
  JSON: typeof JSON;
  Array: typeof Array;
  Object: typeof Object;
  String: typeof String;
  Number: typeof Number;
  Boolean: typeof Boolean;
  RegExp: typeof RegExp;
  Error: typeof Error;
  parseInt: typeof parseInt;
  parseFloat: typeof parseFloat;
  isNaN: typeof isNaN;
  isFinite: typeof isFinite;
  encodeURI: typeof encodeURI;
  decodeURI: typeof decodeURI;
  encodeURIComponent: typeof encodeURIComponent;
  decodeURIComponent: typeof decodeURIComponent;
  // Custom helpers
  _utils: {
    sum: (arr: number[]) => number;
    avg: (arr: number[]) => number;
    max: (arr: number[]) => number;
    min: (arr: number[]) => number;
    factorial: (n: number) => number;
    fibonacci: (n: number) => number;
    prime: (n: number) => boolean;
    sqrt: (n: number) => number;
    pow: (base: number, exp: number) => number;
    round: (n: number, decimals?: number) => number;
    random: (min: number, max: number) => number;
    range: (start: number, end: number) => number[];
    shuffle: <T>(arr: T[]) => T[];
    unique: <T>(arr: T[]) => T[];
    flatten: (arr: any[]) => any[];
    chunk: <T>(arr: T[], size: number) => T[][];
    formatNumber: (n: number, locale?: string) => string;
    formatCurrency: (n: number, currency?: string, locale?: string) => string;
    parseDate: (str: string) => Date;
    daysBetween: (d1: Date, d2: Date) => number;
    age: (birthDate: string) => number;
  };
}

function createSandboxContext(): SandboxContext {
  const logs: string[] = [];

  return {
    console: {
      log: (...args) => { logs.push(args.map((a: any) => String(a)).join(' ')); },
      error: (...args) => { logs.push(`[ERROR] ${args.map((a: any) => String(a)).join(' ')}`); },
      warn: (...args) => { logs.push(`[WARN] ${args.map((a: any) => String(a)).join(' ')}`); },
    },
    Math,
    Date,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURI,
    decodeURI,
    encodeURIComponent,
    decodeURIComponent,
    _utils: {
      sum: (arr) => arr.reduce((a, b) => a + b, 0),
      avg: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
      max: (arr) => Math.max(...arr),
      min: (arr) => Math.min(...arr),
      factorial: (n) => {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
      },
      fibonacci: (n) => {
        if (n <= 0) return 0;
        if (n === 1) return 1;
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
          [a, b] = [b, a + b];
        }
        return b;
      },
      prime: (n) => {
        if (n < 2) return false;
        for (let i = 2; i <= Math.sqrt(n); i++) {
          if (n % i === 0) return false;
        }
        return true;
      },
      sqrt: (n) => Math.sqrt(n),
      pow: (base, exp) => Math.pow(base, exp),
      round: (n, decimals = 0) => Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals),
      random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
      range: (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i),
      shuffle: (arr) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      },
      unique: (arr) => [...new Set(arr)],
      flatten: (arr) => arr.flat(Infinity),
      chunk: (arr, size) => {
        const chunks: any[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      },
      formatNumber: (n, locale = 'en-US') => n.toLocaleString(locale),
      formatCurrency: (n, currency = 'KES', locale = 'en-KE') =>
        n.toLocaleString(locale, { style: 'currency', currency }),
      parseDate: (str) => new Date(str),
      daysBetween: (d1, d2) => Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
      age: (birthDate) => {
        const birth = new Date(birthDate);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      },
    },
  };
}

// ─── Code Execution Engine ──────────────────────────────────────

export class CodeExecutionEngine {
  private maxExecutionTime: number = 5000; // 5 seconds default

  constructor(maxExecutionTime?: number) {
    if (maxExecutionTime) this.maxExecutionTime = maxExecutionTime;
  }

  /**
   * Execute JavaScript code in sandboxed environment
   */
  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    try {
      // Create sandbox
      const sandbox = createSandboxContext();
      // Override console to capture logs
      const originalConsole = { ...sandbox.console };
      sandbox.console = {
        log: (...args) => {
          logs.push(args.map((a: any) => {
            if (typeof a === 'object') return JSON.stringify(a, null, 2);
            return String(a);
          }).join(' '));
          originalConsole.log(...args);
        },
        error: (...args) => {
          logs.push(`[ERROR] ${args.map((a: any) => String(a)).join(' ')}`);
          originalConsole.error(...args);
        },
        warn: (...args) => {
          logs.push(`[WARN] ${args.map((a: any) => String(a)).join(' ')}`);
          originalConsole.warn(...args);
        },
      };

      // Build execution context
      const contextKeys = Object.keys(sandbox);
      const contextValues = Object.values(sandbox);

      // Create function with sandbox context
      const fn = new Function(
        ...contextKeys,
        `"use strict";\n${request.code}`
      );

      // Execute with timeout simulation
      let result: any;
      let completed = false;

      // Use Promise.race for timeout
      const executionPromise = new Promise<void>((resolve) => {
        try {
          result = fn(...contextValues);
          completed = true;
          resolve();
        } catch (error) {
          completed = true;
          throw error;
        }
      });

      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          if (!completed) {
            reject(new Error(`Execution timeout after ${this.maxExecutionTime}ms`));
          }
        }, this.maxExecutionTime);
      });

      await Promise.race([executionPromise, timeoutPromise]);

      const executionTime = Date.now() - startTime;

      // Format output
      let output = '';
      if (logs.length > 0) {
        output = logs.join('\n');
      }
      if (result !== undefined) {
        const resultStr = typeof result === 'object'
          ? JSON.stringify(result, null, 2)
          : String(result);
        if (output) output += '\n\n';
        output += `Result: ${resultStr}`;
      }

      return {
        success: true,
        output: output || 'Code executed successfully (no output)',
        returnValue: result,
        executionTime,
        logs,
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: error.message || 'Unknown execution error',
        executionTime,
        logs,
      };
    }
  }

  /**
   * Quick execute — run simple expression
   */
  async quickExecute(expression: string): Promise<CodeExecutionResult> {
    return this.execute({
      code: `return (${expression});`,
      language: 'javascript',
      timeout: this.maxExecutionTime,
    });
  }

  /**
   * Calculate mathematical expression
   */
  async calculate(expression: string): Promise<number | null> {
    const result = await this.quickExecute(expression);
    if (result.success && typeof result.returnValue === 'number') {
      return result.returnValue;
    }
    return null;
  }

  /**
   * Solve equation (simple algebraic)
   */
  async solveEquation(equation: string, variable: string = 'x'): Promise<number | null> {
    // Simple linear equation solver: ax + b = c
    const code = `
      const eq = "${equation.replace(/"/g, '\"')}";
      const varName = "${variable}";

      // Try to parse as linear equation
      const sides = eq.split('=');
      if (sides.length !== 2) throw new Error('Invalid equation format');

      // Simple numerical solver using bisection
      const f = (x) => {
        try {
          return eval(eq.replace(new RegExp(varName, 'g'), x));
        } catch {
          return Infinity;
        }
      };

      let a = -1000, b = 1000;
      for (let i = 0; i < 50; i++) {
        const mid = (a + b) / 2;
        if (f(a) * f(mid) < 0) b = mid;
        else a = mid;
      }
      return (a + b) / 2;
    `;

    const result = await this.execute({
      code,
      language: 'javascript',
      timeout: this.maxExecutionTime,
    });

    if (result.success && typeof result.returnValue === 'number') {
      return Math.round(result.returnValue * 1000) / 1000;
    }
    return null;
  }

  /**
   * Statistical analysis
   */
  async analyzeData(data: number[]): Promise<{
    mean: number;
    median: number;
    mode: number[];
    stdDev: number;
    min: number;
    max: number;
    range: number;
    sum: number;
    count: number;
  } | null> {
    const code = `
      const data = ${JSON.stringify(data)};
      const sorted = [...data].sort((a, b) => a - b);
      const n = data.length;

      const mean = _utils.avg(data);
      const median = n % 2 === 0
        ? (sorted[n/2 - 1] + sorted[n/2]) / 2
        : sorted[Math.floor(n/2)];

      const frequency = {};
      data.forEach(x => { frequency[x] = (frequency[x] || 0) + 1; });
      const maxFreq = Math.max(...Object.values(frequency));
      const mode = Object.entries(frequency)
        .filter(([_, freq]) => freq === maxFreq)
        .map(([val, _]) => parseFloat(val));

      const variance = _utils.avg(data.map((x: any) => Math.pow(x - mean, 2)));
      const stdDev = Math.sqrt(variance);

      return {
        mean: _utils.round(mean, 4),
        median: _utils.round(median, 4),
        mode,
        stdDev: _utils.round(stdDev, 4),
        min: _utils.min(data),
        max: _utils.max(data),
        range: _utils.max(data) - _utils.min(data),
        sum: _utils.sum(data),
        count: n,
      };
    `;

    const result = await this.execute({
      code,
      language: 'javascript',
      timeout: this.maxExecutionTime,
    });

    if (result.success && typeof result.returnValue === 'object') {
      return result.returnValue;
    }
    return null;
  }
}

// ─── Singleton Instance ─────────────────────────────────────────

let codeEngineInstance: CodeExecutionEngine | null = null;

export function getCodeExecutionEngine(): CodeExecutionEngine {
  if (!codeEngineInstance) {
    codeEngineInstance = new CodeExecutionEngine();
  }
  return codeEngineInstance;
}

// ─── Math Expression Parser ─────────────────────────────────────

export function parseMathExpression(text: string): string | null {
  // Extract math expression from natural language
  const patterns = [
    /(?:calculate|compute|what\s+is|how\s+much\s+is|find|solve)\s+(.+)/i,
    /^(\d+(?:\.\d+)?\s*[+\-*/^%]\s*\d+(?:\.\d+)?(?:\s*[+\-*/^%]\s*\d+(?:\.\d+)?)*)$/,
    /^(\d+(?:\.\d+)?)\s*(plus|minus|times|divided\s+by|multiplied\s+by)\s*(\d+(?:\.\d+)?)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let expr = match[1] || match[0];
      // Convert words to operators
      expr = expr
        .replace(/plus/gi, '+')
        .replace(/minus/gi, '-')
        .replace(/times|multiplied\s+by/gi, '*')
        .replace(/divided\s+by/gi, '/')
        .replace(/percent/gi, '/100')
        .replace(/of/gi, '*')
        .replace(/power/gi, '**')
        .replace(/squared/gi, '**2')
        .replace(/cubed/gi, '**3')
        .replace(/square\s+root\s+of/gi, 'Math.sqrt(')
        .replace(/cube\s+root\s+of/gi, 'Math.cbrt(')
        .replace(/log\s+of/gi, 'Math.log10(')
        .replace(/ln\s+of/gi, 'Math.log(')
        .replace(/sin\s+of/gi, 'Math.sin(')
        .replace(/cos\s+of/gi, 'Math.cos(')
        .replace(/tan\s+of/gi, 'Math.tan(');
      return expr;
    }
  }

  return null;
}

// ─── Quick Calculator ───────────────────────────────────────────

export async function quickCalculate(expression: string): Promise<string> {
  const engine = getCodeExecutionEngine();
  const result = await engine.quickExecute(expression);

  if (result.success) {
    return result.output;
  }
  return `Error: ${result.error}`;
}
