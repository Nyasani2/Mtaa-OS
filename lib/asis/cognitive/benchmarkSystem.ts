// ASIS v3 — Benchmark System
// Compare ASIS vs GPT on identical tasks
// Measure: time, accuracy, cost, reasoning quality

import {
  ResearchEngine,
} from './researchEngine';
import {
  SimulationEngine,
} from './simulationEngine';
import {
  CognitiveEngine,
} from './cognitiveEngine';
import {
  KnowledgeNetwork,
} from '../network/knowledgeNetwork';
import {
  AsisRequest,
  AsisContext,
} from '../types';

interface BenchmarkTask {
  id: string;
  category: 'math' | 'code' | 'reasoning' | 'knowledge' | 'creative' | 'diagnosis';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  prompt: string;
  expectedAnswer?: string;
  testCases?: Array<{ input: any; expected: any }>;
  timeLimit?: number; // milliseconds
}

interface BenchmarkResult {
  taskId: string;
  category: string;
  difficulty: string;

  // ASIS results
  asis: {
    answer: string;
    timeMs: number;
    confidence: number;
    sourcesUsed: number;
    networkNodesAccessed: number;
    growthFactor: number;
    correct: boolean;
    explanation: string;
  };

  // GPT results (simulated or actual API)
  gpt: {
    answer: string;
    timeMs: number;
    costUsd: number;
    correct: boolean;
    explanation: string;
  };

  // Comparison
  winner: 'asis' | 'gpt' | 'tie';
  speedup: number; // ASIS time / GPT time
  costAdvantage: number; // ASIS cost / GPT cost (ASIS = $0)
  reasoningQuality: 'asis_better' | 'gpt_better' | 'comparable';
}

interface BenchmarkSuite {
  name: string;
  description: string;
  tasks: BenchmarkTask[];
  results: BenchmarkResult[];
  summary: {
    totalTasks: number;
    asisWins: number;
    gptWins: number;
    ties: number;
    avgAsisTime: number;
    avgGptTime: number;
    totalGptCost: number;
    asisAccuracy: number;
    gptAccuracy: number;
  };
}

/**
 * Benchmark System: Prove M-Theory works
 * 
 * Run identical tasks through ASIS and GPT
 * Measure everything: time, accuracy, cost, reasoning
 * Generate report showing where ASIS wins
 */
export class BenchmarkSystem {
  private researchEngine: ResearchEngine;
  private simulationEngine: SimulationEngine;
  private cognitiveEngine: CognitiveEngine;
  private network: KnowledgeNetwork;
  private gptApiKey?: string;

  constructor(
    network: KnowledgeNetwork,
    gptApiKey?: string
  ) {
    this.network = network;
    this.researchEngine = new ResearchEngine(network);
    this.simulationEngine = new SimulationEngine(network);
    this.cognitiveEngine = new CognitiveEngine(network);
    this.gptApiKey = gptApiKey;
  }

  // ═══════════════════════════════════════════════════════════════
  // BENCHMARK TASKS
  // ═══════════════════════════════════════════════════════════════

  getStandardTasks(): BenchmarkTask[] {
    return [
      // MATH TASKS
      {
        id: 'math-1',
        category: 'math',
        difficulty: 'easy',
        prompt: 'What is 2 + 2 * 2?',
        expectedAnswer: '6',
        timeLimit: 1000,
      },
      {
        id: 'math-2',
        category: 'math',
        difficulty: 'medium',
        prompt: 'Solve for x: 2x^2 + 5x - 3 = 0',
        expectedAnswer: 'x = 0.5 or x = -3',
        timeLimit: 2000,
      },
      {
        id: 'math-3',
        category: 'math',
        difficulty: 'hard',
        prompt: 'What is the sum of all prime numbers between 1 and 100?',
        expectedAnswer: '1060',
        timeLimit: 3000,
      },
      {
        id: 'math-4',
        category: 'math',
        difficulty: 'expert',
        prompt: 'Find the derivative of f(x) = x^3 * sin(x)',
        expectedAnswer: 'f\'(x) = 3x^2*sin(x) + x^3*cos(x)',
        timeLimit: 5000,
      },

      // CODE TASKS
      {
        id: 'code-1',
        category: 'code',
        difficulty: 'easy',
        prompt: 'Write a function that reverses a string in JavaScript',
        expectedAnswer: 'function reverseString(str) { return str.split("").reverse().join(""); }',
        timeLimit: 2000,
      },
      {
        id: 'code-2',
        category: 'code',
        difficulty: 'medium',
        prompt: 'Write a function to check if a number is prime in TypeScript',
        expectedAnswer: 'function isPrime(n: number): boolean { if (n < 2) return false; for (let i = 2; i <= Math.sqrt(n); i++) { if (n % i === 0) return false; } return true; }',
        timeLimit: 3000,
      },
      {
        id: 'code-3',
        category: 'code',
        difficulty: 'hard',
        prompt: 'Implement a binary search tree with insert, search, and delete in TypeScript',
        timeLimit: 10000,
      },

      // REASONING TASKS
      {
        id: 'reasoning-1',
        category: 'reasoning',
        difficulty: 'medium',
        prompt: 'If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly?',
        expectedAnswer: 'No — we cannot conclude that. While all roses are flowers, the flowers that fade quickly might not include any roses.',
        timeLimit: 3000,
      },
      {
        id: 'reasoning-2',
        category: 'reasoning',
        difficulty: 'hard',
        prompt: 'A farmer has 17 sheep and all but 9 die. How many are left?',
        expectedAnswer: '9',
        timeLimit: 2000,
      },

      // KNOWLEDGE TASKS
      {
        id: 'knowledge-1',
        category: 'knowledge',
        difficulty: 'easy',
        prompt: 'What is the capital of Kenya?',
        expectedAnswer: 'Nairobi',
        timeLimit: 1000,
      },
      {
        id: 'knowledge-2',
        category: 'knowledge',
        difficulty: 'medium',
        prompt: 'Who wrote "Things Fall Apart" and when was it published?',
        expectedAnswer: 'Chinua Achebe, 1958',
        timeLimit: 2000,
      },

      // DIAGNOSIS TASKS
      {
        id: 'diagnosis-1',
        category: 'diagnosis',
        difficulty: 'medium',
        prompt: 'A Toyota Corolla shows P0171 (System Too Lean Bank 1). What are the most likely causes?',
        expectedAnswer: 'Vacuum leak, faulty MAF sensor, clogged fuel injectors, weak fuel pump',
        timeLimit: 3000,
      },
    ];
  }

  // ═══════════════════════════════════════════════════════════════
  // RUN BENCHMARK
  // ═══════════════════════════════════════════════════════════════

  async runBenchmark(
    tasks?: BenchmarkTask[],
    options: {
      runGpt?: boolean;
      gptModel?: string;
    } = {}
  ): Promise<BenchmarkSuite> {
    const taskList = tasks || this.getStandardTasks();
    const results: BenchmarkResult[] = [];

    for (const task of taskList) {
      console.log(`\n[Benchmark] Running task: ${task.id} — ${task.category} (${task.difficulty})`);

      const result = await this.runTask(task, options);
      results.push(result);

      // Log progress
      console.log(`  ASIS: ${result.asis.correct ? '✓' : '✗'} (${result.asis.timeMs}ms)`);
      if (options.runGpt) {
        console.log(`  GPT:  ${result.gpt.correct ? '✓' : '✗'} (${result.gpt.timeMs}ms, $${result.gpt.costUsd.toFixed(4)})`);
      }
      console.log(`  Winner: ${result.winner.toUpperCase()}`);
    }

    return this.buildSuite(taskList, results);
  }

  private async runTask(
    task: BenchmarkTask,
    options: { runGpt?: boolean; gptModel?: string }
  ): Promise<BenchmarkResult> {
    // Run ASIS
    const asisResult = await this.runAsis(task);

    // Run GPT (if enabled)
    let gptResult = {
      answer: 'Not run',
      timeMs: 0,
      costUsd: 0,
      correct: false,
      explanation: '',
    };

    if (options.runGpt && this.gptApiKey) {
      gptResult = await this.runGpt(task, options.gptModel || 'gpt-4');
    }

    // Determine winner
    const winner = this.determineWinner(asisResult, gptResult, task.expectedAnswer);

    return {
      taskId: task.id,
      category: task.category,
      difficulty: task.difficulty,
      asis: asisResult,
      gpt: gptResult,
      winner,
      speedup: gptResult.timeMs > 0 ? asisResult.timeMs / gptResult.timeMs : 1,
      costAdvantage: gptResult.costUsd > 0 ? 0 / gptResult.costUsd : 1, // ASIS = $0
      reasoningQuality: this.compareReasoning(asisResult, gptResult),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // ASIS EXECUTION
  // ═══════════════════════════════════════════════════════════════

  private async runAsis(task: BenchmarkTask): Promise<BenchmarkResult['asis']> {
    const startTime = Date.now();

    const context: AsisContext = {
      userId: 'benchmark',
      userName: 'Benchmark',
      language: 'en',
      region: 'global',
      timezone: 'UTC',
      currentApp: 'benchmark',
      sessionId: `benchmark_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const request: AsisRequest = {
      message: task.prompt,
      context,
      domain: task.category,
      history: [],
    };

    // For math: use knowledge network directly
    let answer = '';
    let confidence = 0.5;
    let sourcesUsed = 0;
    let networkNodesAccessed = 0;
    let growthFactor = 0;

    if (task.category === 'math') {
      const mathResult = this.solveMath(task.prompt);
      answer = mathResult.answer;
      confidence = mathResult.confidence;
    } else if (task.category === 'code') {
      const codeResult = await this.researchEngine.researchCode(task.prompt);
      answer = codeResult.solution;
      confidence = 0.7;
      sourcesUsed = codeResult.sources.length;
    } else if (task.category === 'knowledge') {
      const research = await this.researchEngine.research(task.prompt, context);
      answer = research.summary;
      confidence = research.confidence;
      sourcesUsed = research.sources.length;
    } else {
      // General reasoning — use cognitive engine
      const response = await this.cognitiveEngine.think(request);
      answer = response.message;
      confidence = response.confidence;
      networkNodesAccessed = response.sources?.length || 0;
      growthFactor = response.growthEvent?.factor?.final || 0;
    }

    const timeMs = Date.now() - startTime;
    const correct = this.checkAnswer(answer, task.expectedAnswer);

    return {
      answer,
      timeMs,
      confidence,
      sourcesUsed,
      networkNodesAccessed,
      growthFactor,
      correct,
      explanation: `Solved via ${task.category} engine in ${timeMs}ms`,
    };
  }

  private solveMath(problem: string): { answer: string; confidence: number } {
    // Simple math solver — can be enhanced with math.js
    try {
      // Clean the problem
      const clean = problem
        .replace(/What is\?/gi, '')
        .replace(/Solve for x:/gi, '')
        .replace(/Find the derivative of/gi, '')
        .trim();

      // Basic arithmetic
      if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(clean)) {
        // Safe eval — only allow math operators
        const result = Function('"use strict"; return (' + clean + ')')();
        return { answer: String(result), confidence: 0.95 };
      }

      // Quadratic equations
      const quadMatch = clean.match(/(\d*)x\^2\s*([\+\-])\s*(\d*)x\s*([\+\-])\s*(\d+)\s*=\s*0/);
      if (quadMatch) {
        const a = parseFloat(quadMatch[1]) || 1;
        const b = parseFloat(quadMatch[2] + (quadMatch[3] || 1));
        const c = parseFloat(quadMatch[4] + quadMatch[5]);

        const discriminant = b * b - 4 * a * c;
        if (discriminant >= 0) {
          const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
          const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
          return { answer: `x = ${x1.toFixed(2)} or x = ${x2.toFixed(2)}`, confidence: 0.95 };
        }
      }

      // Prime sum
      if (problem.includes('prime numbers between')) {
        const match = problem.match(/between (\d+) and (\d+)/);
        if (match) {
          const start = parseInt(match[1]);
          const end = parseInt(match[2]);
          let sum = 0;
          for (let i = start; i <= end; i++) {
            if (this.isPrime(i)) sum += i;
          }
          return { answer: String(sum), confidence: 0.95 };
        }
      }

      return { answer: 'Unable to solve — math engine needs enhancement', confidence: 0.3 };
    } catch (err) {
      return { answer: 'Error in math solver', confidence: 0.1 };
    }
  }

  private isPrime(n: number): boolean {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // GPT EXECUTION
  // ═══════════════════════════════════════════════════════════════

  private async runGpt(
    task: BenchmarkTask,
    model: string
  ): Promise<BenchmarkResult['gpt']> {
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.gptApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant. Answer concisely.' },
            { role: 'user', content: task.prompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'No response';
      const timeMs = Date.now() - startTime;

      // Estimate cost (GPT-4: $0.03 per 1K input tokens, $0.06 per 1K output tokens)
      const inputTokens = task.prompt.length / 4; // Rough estimate
      const outputTokens = answer.length / 4;
      const costUsd = (inputTokens * 0.03 + outputTokens * 0.06) / 1000;

      return {
        answer,
        timeMs,
        costUsd,
        correct: this.checkAnswer(answer, task.expectedAnswer),
        explanation: 'Generated by GPT-4',
      };
    } catch (err) {
      return {
        answer: 'GPT API error',
        timeMs: Date.now() - startTime,
        costUsd: 0,
        correct: false,
        explanation: String(err),
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ANSWER CHECKING
  // ═══════════════════════════════════════════════════════════════

  private checkAnswer(answer: string, expected?: string): boolean {
    if (!expected) return false; // No expected answer — manual review needed

    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedExpected = expected.toLowerCase().trim();

    // Exact match
    if (normalizedAnswer === normalizedExpected) return true;

    // Contains expected
    if (normalizedAnswer.includes(normalizedExpected)) return true;

    // Expected contains answer
    if (normalizedExpected.includes(normalizedAnswer)) return true;

    // Numeric tolerance (for math)
    const answerNum = parseFloat(normalizedAnswer);
    const expectedNum = parseFloat(normalizedExpected);
    if (!isNaN(answerNum) && !isNaN(expectedNum)) {
      return Math.abs(answerNum - expectedNum) < 0.01;
    }

    // Word overlap (for text answers)
    const answerWords = new Set(normalizedAnswer.split(/\s+/));
    const expectedWords = new Set(normalizedExpected.split(/\s+/));
    const overlap = [...answerWords].filter(w => expectedWords.has(w)).length;
    const similarity = overlap / Math.max(answerWords.size, expectedWords.size);

    return similarity > 0.7;
  }

  // ═══════════════════════════════════════════════════════════════
  // WINNER DETERMINATION
  // ═══════════════════════════════════════════════════════════════

  private determineWinner(
    asis: BenchmarkResult['asis'],
    gpt: BenchmarkResult['gpt'],
    expectedAnswer?: string
  ): 'asis' | 'gpt' | 'tie' {
    if (!expectedAnswer) return 'tie';

    if (asis.correct && !gpt.correct) return 'asis';
    if (!asis.correct && gpt.correct) return 'gpt';
    if (asis.correct && gpt.correct) {
      // Both correct — faster wins
      return asis.timeMs <= gpt.timeMs ? 'asis' : 'gpt';
    }
    // Both wrong — tie
    return 'tie';
  }

  private compareReasoning(
    asis: BenchmarkResult['asis'],
    gpt: BenchmarkResult['gpt']
  ): 'asis_better' | 'gpt_better' | 'comparable' {
    if (asis.confidence > 0.8 && gpt.correct) return 'comparable';
    if (asis.confidence > 0.8) return 'asis_better';
    if (gpt.correct) return 'gpt_better';
    return 'comparable';
  }

  // ═══════════════════════════════════════════════════════════════
  // SUITE BUILDING
  // ═══════════════════════════════════════════════════════════════

  private buildSuite(tasks: BenchmarkTask[], results: BenchmarkResult[]): BenchmarkSuite {
    const asisWins = results.filter(r => r.winner === 'asis').length;
    const gptWins = results.filter(r => r.winner === 'gpt').length;
    const ties = results.filter(r => r.winner === 'tie').length;

    const asisCorrect = results.filter(r => r.asis.correct).length;
    const gptCorrect = results.filter(r => r.gpt.correct).length;

    return {
      name: 'ASIS vs GPT Benchmark Suite',
      description: 'Head-to-head comparison on math, code, reasoning, and knowledge tasks',
      tasks,
      results,
      summary: {
        totalTasks: results.length,
        asisWins,
        gptWins,
        ties,
        avgAsisTime: results.reduce((sum, r) => sum + r.asis.timeMs, 0) / results.length,
        avgGptTime: results.reduce((sum, r) => sum + r.gpt.timeMs, 0) / results.length || 0,
        totalGptCost: results.reduce((sum, r) => sum + r.gpt.costUsd, 0),
        asisAccuracy: asisCorrect / results.length,
        gptAccuracy: gptCorrect / results.length,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // REPORT GENERATION
  // ═══════════════════════════════════════════════════════════════

  generateReport(suite: BenchmarkSuite): string {
    const parts: string[] = [];

    parts.push('# ASIS vs GPT Benchmark Report');
    parts.push('');
    parts.push(`**Date:** ${new Date().toISOString()}`);
    parts.push(`**Total Tasks:** ${suite.summary.totalTasks}`);
    parts.push('');

    // Summary
    parts.push('## Summary');
    parts.push('');
    parts.push(`| Metric | ASIS | GPT |`);
    parts.push(`|--------|------|-----|`);
    parts.push(`| Wins | ${suite.summary.asisWins} | ${suite.summary.gptWins} |`);
    parts.push(`| Ties | ${suite.summary.ties} | — |`);
    parts.push(`| Accuracy | ${(suite.summary.asisAccuracy * 100).toFixed(1)}% | ${(suite.summary.gptAccuracy * 100).toFixed(1)}% |`);
    parts.push(`| Avg Time | ${suite.summary.avgAsisTime.toFixed(0)}ms | ${suite.summary.avgGptTime.toFixed(0)}ms |`);
    parts.push(`| Total Cost | $0.00 | $${suite.summary.totalGptCost.toFixed(4)} |`);
    parts.push('');

    // Results by category
    parts.push('## Results by Category');
    parts.push('');

    const categories = [...new Set(suite.results.map(r => r.category))];
    for (const category of categories) {
      const catResults = suite.results.filter(r => r.category === category);
      const catAsisWins = catResults.filter(r => r.winner === 'asis').length;
      const catGptWins = catResults.filter(r => r.winner === 'gpt').length;

      parts.push(`### ${category.toUpperCase()}`);
      parts.push(`- ASIS wins: ${catAsisWins}/${catResults.length}`);
      parts.push(`- GPT wins: ${catGptWins}/${catResults.length}`);
      parts.push('');

      for (const result of catResults) {
        parts.push(`**${result.taskId}** (${result.difficulty})`);
        parts.push(`- ASIS: ${result.asis.correct ? '✓' : '✗'} ${result.asis.timeMs}ms`);
        if (result.gpt.timeMs > 0) {
          parts.push(`- GPT: ${result.gpt.correct ? '✓' : '✗'} ${result.gpt.timeMs}ms $${result.gpt.costUsd.toFixed(4)}`);
        }
        parts.push(`- Winner: **${result.winner.toUpperCase()}**`);
        parts.push('');
      }
    }

    // Conclusions
    parts.push('## Conclusions');
    parts.push('');

    if (suite.summary.asisWins > suite.summary.gptWins) {
      parts.push('🏆 **ASIS wins overall!** M-Theory demonstrates competitive intelligence at zero cost.');
    } else if (suite.summary.gptWins > suite.summary.asisWins) {
      parts.push('📊 **GPT wins overall**, but ASIS shows promise in specific domains.');
    } else {
      parts.push('🤝 **Tie!** ASIS matches GPT performance at zero cost.');
    }

    parts.push('');
    parts.push('### ASIS Strengths');
    parts.push('- Zero operating cost');
    parts.push('- Local execution (no network latency)');
    parts.push('- Full audit trail');
    parts.push('- Privacy-preserving');
    parts.push('- Grows from every interaction');
    parts.push('');
    parts.push('### GPT Strengths');
    parts.push('- Superior language fluency');
    parts.push('- Broader knowledge base');
    parts.push('- Better at novel creative tasks');
    parts.push('');

    return parts.join('\n');
  }
}

export default BenchmarkSystem;
