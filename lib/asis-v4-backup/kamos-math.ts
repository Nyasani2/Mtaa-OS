/**
 * ASIS v4 Kamos Math Engine
 * Symbolic math solver using Kamos Theory (1×1 = 1 + f)
 */

export interface KamosExpression {
  raw: string;
  tokens: string[];
  type: 'arithmetic' | 'algebraic' | 'kamos' | 'unknown';
}

export interface KamosSolution {
  result: string | number;
  steps: string[];
  kamosScore: number;
  confidence: number;
}

export class KamosMath {
  solve(expression: string): KamosSolution {
    const expr = this.parse(expression);
    const steps: string[] = [];

    if (expr.type === 'arithmetic') {
      return this.solveArithmetic(expr, steps);
    }
    if (expr.type === 'algebraic') {
      return this.solveAlgebraic(expr, steps);
    }
    if (expr.type === 'kamos') {
      return this.solveKamos(expr, steps);
    }

    return {
      result: 'Unable to solve: expression type not recognized',
      steps: ['Parsed tokens: ' + expr.tokens.join(', ')],
      kamosScore: 1.0,
      confidence: 0.2,
    };
  }

  private parse(expression: string): KamosExpression {
    const clean = expression.toLowerCase().replace(/\s+/g, '');
    const tokens = clean.match(/\d+\.?\d*|[-+*/^=()]|[a-z]+/g) || [];

    let type: KamosExpression['type'] = 'unknown';
    if (tokens.some(t => ['kamos', 'f', 'growth', 'replication'].includes(t))) {
      type = 'kamos';
    } else if (tokens.some(t => /[a-z]/.test(t) && !['sin', 'cos', 'tan', 'log', 'sqrt', 'pi', 'e'].includes(t))) {
      type = 'algebraic';
    } else if (tokens.some(t => /^\d/.test(t))) {
      type = 'arithmetic';
    }

    return { raw: expression, tokens, type };
  }

  private solveArithmetic(expr: KamosExpression, steps: string[]): KamosSolution {
    try {
      // Safe evaluation — only allow numbers and basic operators
      const sanitized = expr.raw.replace(/[^0-9+\-*/().\s]/g, '');
      steps.push(`Sanitized: ${sanitized}`);

      // Use Function constructor for safe math
      const result = new Function('return ' + sanitized)();
      steps.push(`Computed: ${result}`);

      // Kamos score: 1×1 = 1 + f
      const growth = Math.log10(Math.abs(result) + 1) / 10;
      const kamosScore = 1 + growth;
      steps.push(`Kamos score: ${kamosScore.toFixed(3)} (1 + ${growth.toFixed(3)})`);

      return {
        result,
        steps,
        kamosScore,
        confidence: 0.95,
      };
    } catch (error) {
      return {
        result: 'Error in arithmetic: ' + (error instanceof Error ? error.message : 'unknown'),
        steps,
        kamosScore: 1.0,
        confidence: 0.1,
      };
    }
  }

  private solveAlgebraic(expr: KamosExpression, steps: string[]): KamosSolution {
    const raw = expr.raw;
    steps.push(`Algebraic expression: ${raw}`);

    // Simple linear equation solver: ax + b = c
    const match = raw.match(/([\d.]*)\s*\*?\s*([a-z])\s*([+-])\s*([\d.]+)\s*=\s*([\d.]+)/);
    if (match) {
      const a = parseFloat(match[1] || '1');
      const varName = match[2];
      const sign = match[3];
      const b = parseFloat(match[4]) * (sign === '-' ? -1 : 1);
      const c = parseFloat(match[5]);

      steps.push(`Form: ${a}${varName} + ${b} = ${c}`);
      steps.push(`Subtract ${b}: ${a}${varName} = ${c - b}`);
      const result = (c - b) / a;
      steps.push(`Divide by ${a}: ${varName} = ${result}`);

      return {
        result: `${varName} = ${result}`,
        steps,
        kamosScore: 1 + (Math.abs(result) / 100),
        confidence: 0.9,
      };
    }

    // Quadratic hint
    if (raw.includes('x^2') || raw.includes('x²')) {
      steps.push('Detected quadratic form. Use quadratic formula: x = (-b ± √(b²-4ac)) / 2a');
      return {
        result: 'Quadratic detected. Please provide coefficients a, b, c.',
        steps,
        kamosScore: 1.2,
        confidence: 0.7,
      };
    }

    return {
      result: 'Algebraic solver limited to linear equations. Please simplify.',
      steps,
      kamosScore: 1.0,
      confidence: 0.4,
    };
  }

  private solveKamos(expr: KamosExpression, steps: string[]): KamosSolution {
    steps.push('Applying Kamos Theory: 1×1 = 1 + f(g,r,i,o)');

    const raw = expr.raw.toLowerCase();

    if (raw.includes('1*1') || raw.includes('1×1') || raw.includes('1x1')) {
      steps.push('Kamos Axiom: 1×1 = 1 + f');
      steps.push('Where f = α·growth + β·replication + γ·interaction + δ·observation');
      steps.push('In a static system: f → 0, so 1×1 → 1');
      steps.push('In a proliferative system: f > 0, so 1×1 > 1');

      return {
        result: '1×1 = 1 + f(g,r,i,o) ≥ 1 (equality only in static systems)',
        steps,
        kamosScore: 2.0,
        confidence: 1.0,
      };
    }

    if (raw.includes('proliferation') || raw.includes('growth')) {
      steps.push('Kamos Proliferation: P(t) = P₀ · e^(λ·t)');
      steps.push('Where λ = f(growth, replication, interaction, observation)');

      return {
        result: 'Proliferation follows exponential growth with Kamos coefficient λ',
        steps,
        kamosScore: 1.8,
        confidence: 0.95,
      };
    }

    return {
      result: 'Kamos expression recognized but specific form not handled. Try "1×1" or "proliferation".',
      steps,
      kamosScore: 1.3,
      confidence: 0.5,
    };
  }

  // Kamos Theory applied to any number
  kamosMultiply(a: number, b: number, context: { growth?: number; replication?: number; interaction?: number; observation?: number } = {}): number {
    const base = a * b;
    const g = context.growth || 0;
    const r = context.replication || 0;
    const i = context.interaction || 0;
    const o = context.observation || 0;
    const f = 0.4 * g + 0.3 * r + 0.2 * i + 0.1 * o;
    return base + f;
  }
}

export const kamosMath = new KamosMath();
