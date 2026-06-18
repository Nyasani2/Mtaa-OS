// ASIS v3 — M-Theory Engine with Cloud AI Routing
// Routes: M-Theory (local) -> Groq (free) -> Kimi (paid)

import Constants from 'expo-constants';
import { groqClient } from '../api/groq-client';

const KIMI_API_KEY = Constants.expoConfig?.extra?.kimiApiKey ||
  process.env.EXPO_PUBLIC_KIMI_API_KEY || '';
const KIMI_BASE_URL = 'https://api.moonshot.cn/v1';

function computeGrowthFactor(interactionCount, nodeCount, avgConfidence) {
  const growth = Math.log10(interactionCount + 1) * 0.3;
  const replication = (nodeCount / Math.max(interactionCount, 1)) * 0.4;
  const interaction = avgConfidence * 0.2;
  const observation = Math.min(interactionCount / 100, 1) * 0.1;
  return 1 + growth + replication + interaction + observation;
}

function constitutionalGate(query) {
  const harmful = [
    /hack|exploit|breach|attack/i,
    /steal|fraud|scam|phish/i,
    /bomb|weapon|terror|kill/i,
    /child|minor|underage/i,
    /dox|swat|stalk/i,
  ];

  for (const pattern of harmful) {
    if (pattern.test(query)) {
      return { allowed: false, reason: 'Constitutional gate: Request violates Ubuntu values (human dignity, non-harm)', riskLevel: 'high' };
    }
  }
  return { allowed: true, riskLevel: 'none' };
}

function detectDomain(query) {
  const q = query.toLowerCase();

  if (/^[\d\+\-\*\/\^\(\)\s\.]+$/.test(q.replace(/what is|calculate|solve|compute/g, '').trim())) {
    return { domain: 'math', complexity: 0.1 };
  }
  if (/write.*code|javascript|typescript|python|function|algorithm|sort|fibonacci|factorial/i.test(q)) {
    return { domain: 'code', complexity: 0.3 };
  }
  if (/search|who is|what is the capital|current president|news|weather/i.test(q)) {
    return { domain: 'research', complexity: 0.7 };
  }
  if (/explain|describe|how does|why is|what causes|theory|philosophy|science/i.test(q)) {
    return { domain: 'knowledge', complexity: 0.8 };
  }
  if (/image|picture|draw|generate|create.*art|photo/i.test(q)) {
    return { domain: 'image', complexity: 0.9 };
  }
  if (/voice|speak|say|audio|sound/i.test(q)) {
    return { domain: 'voice', complexity: 0.8 };
  }
  return { domain: 'general', complexity: 0.5 };
}

function executeCode(code) {
  try {
    if (/eval|Function|require|import|fetch|XMLHttpRequest|document|window|process|global/i.test(code)) {
      return { result: '', error: 'Security: Blocked unsafe code pattern' };
    }
    const safeFn = new Function('return (' + code + ')');
    const result = safeFn();
    return { result: String(result) };
  } catch (err) {
    return { result: '', error: err.message };
  }
}

function solveMath(expression) {
  const clean = expression.replace(/what is|calculate|solve|compute/gi, '').trim();
  const steps = ['Expression: ' + clean];

  try {
    const sanitized = clean.replace(/[^\d\+\-\*\/\^\(\)\.\s]/g, '');
    const result = Function('"use strict"; return (' + sanitized + ')')();
    steps.push('Result: ' + result);
    return { result: String(result), steps: steps };
  } catch {
    return { result: 'Error', steps: ['Could not parse expression'] };
  }
}

async function kimiChat(messages) {
  if (!KIMI_API_KEY || KIMI_API_KEY.length < 10) {
    return { text: '', error: 'Kimi API key not configured' };
  }

  try {
    const response = await fetch(KIMI_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + KIMI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { text: '', error: 'Kimi HTTP ' + response.status + ': ' + errorText };
    }

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
    };
  } catch (err) {
    return { text: '', error: err.message };
  }
}

export class AsisV3Engine {
  constructor() {
    this.network = {
      nodes: new Map(),
      edges: new Map(),
      interactionCount: 0,
      groqRequests: 0,
      kimiRequests: 0,
      totalTokensUsed: 0,
      totalCostUsd: 0,
    };
    this.sessionStart = Date.now();
  }

  getStats() {
    const nodeCount = this.network.nodes.size;
    const avgConfidence = nodeCount > 0
      ? Array.from(this.network.nodes.values()).reduce((s, n) => s + n.confidence, 0) / nodeCount
      : 0;

    return {
      nodes: nodeCount,
      interactions: this.network.interactionCount,
      groqRequests: this.network.groqRequests,
      kimiRequests: this.network.kimiRequests,
      totalTokens: this.network.totalTokensUsed,
      totalCostUsd: this.network.totalCostUsd.toFixed(6),
      avgConfidence: avgConfidence.toFixed(2),
      sessionTime: Math.floor((Date.now() - this.sessionStart) / 1000),
      groqConnected: groqClient.isConfigured(),
      kimiConnected: KIMI_API_KEY.length > 10,
    };
  }

  async process(query) {
    const start = Date.now();
    this.network.interactionCount++;

    const safety = constitutionalGate(query);
    if (!safety.allowed) {
      return {
        text: 'ASIS Constitutional Gate blocked this request.\n\nReason: ' + safety.reason + '\n\nUbuntu values: human dignity, fairness, transparency, sovereignty, non-harm, consent.',
        growthFactor: 1.0,
        confidence: 1.0,
        domain: 'safety',
        source: 'constitutional_gate',
        timing: Date.now() - start,
      };
    }

    const { domain, complexity } = detectDomain(query);

    let responseText = '';
    let source = 'mtheory';
    let confidence = 0.8;
    let costInfo = '';

    if (complexity < 0.6) {
      if (domain === 'math') {
        const math = solveMath(query);
        responseText = math.steps.join('\n') + '\n\n**Answer: ' + math.result + '**';
        confidence = 0.95;
      } else if (domain === 'code') {
        const codeMatch = query.match(/write.*code.*for\s+(.+)/i) ||
                         query.match(/javascript.*to\s+(.+)/i) ||
                         [null, query];
        const task = codeMatch[1] || query;

        let generatedCode = '';
        if (/sort|array/i.test(task)) {
          generatedCode = 'const arr = [3, 1, 4, 1, 5];\nconst sorted = arr.sort((a, b) => a - b);\nconsole.log(sorted);\n// Output: [1, 1, 3, 4, 5]';
        } else if (/fibonacci|fib/i.test(task)) {
          generatedCode = 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\nconsole.log(fibonacci(10));\n// Output: 55';
        } else if (/factorial/i.test(task)) {
          generatedCode = 'function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}\nconsole.log(factorial(5));\n// Output: 120';
        } else {
          generatedCode = '// Task: ' + task + '\nfunction solution() {\n  // Implementation here\n  return "Result";\n}\nconsole.log(solution());';
        }

        const exec = executeCode(generatedCode.replace(/\/\/.*/g, '').replace(/console\.log/g, ''));
        responseText = '**Generated Code:**\n\n```javascript\n' + generatedCode + '\n```\n\n**Execution Result:** ' + (exec.error ? 'Error: ' + exec.error : exec.result || 'Code validated successfully');
        confidence = 0.75;
      } else {
        responseText = 'I am ASIS, the M-Theory intelligence engine for MTAA OS.\n\nI can help with:\n- Mathematics and calculations\n- Code generation and debugging\n- MTAA app navigation\n- Knowledge queries (via Groq cloud when available)\n- Constitutional governance and safety\n\nMy knowledge network has ' + this.network.nodes.size + ' nodes and is growing with every interaction.\n\nTry: "what is 2 + 2 * 2", "write javascript code for fibonacci", or "explain quantum computing"';
        confidence = 0.4;
      }
    }
    else if (groqClient.isConfigured()) {
      source = 'groq';
      const model = complexity > 0.85 ? 'smart' : 'fast';

      const groqResult = await groqClient.chat([
        { role: 'system', content: 'You are ASIS, the M-Theory intelligence engine for MTAA OS. Be concise, accurate, and helpful. Always ground responses in factual knowledge.' },
        { role: 'user', content: query },
      ], { temperature: 0.7, maxTokens: 1024, model: model });

      if (groqResult.error) {
        if (KIMI_API_KEY.length > 10) {
          const kimiResult = await kimiChat([
            { role: 'system', content: 'You are ASIS, the M-Theory intelligence engine for MTAA OS.' },
            { role: 'user', content: query },
          ]);
          if (!kimiResult.error) {
            responseText = kimiResult.text;
            source = 'kimi';
            this.network.kimiRequests++;
            this.network.totalTokensUsed += kimiResult.tokens || 0;
            confidence = 0.85;
          } else {
            responseText = 'Groq Error: ' + groqResult.error + '\n\nKimi Error: ' + kimiResult.error + '\n\nFalling back to M-Theory: This query requires cloud AI. Please check your API configuration or try a simpler query.';
            source = 'mtheory_fallback';
            confidence = 0.3;
          }
        } else {
          responseText = 'Groq Error: ' + groqResult.error + '\n\nFalling back to M-Theory: This query requires cloud AI. Please check your Groq API key or try a simpler query.';
          source = 'mtheory_fallback';
          confidence = 0.3;
        }
      } else {
        responseText = groqResult.text;
        this.network.groqRequests++;
        this.network.totalTokensUsed += groqResult.cost.tokens;
        this.network.totalCostUsd += groqResult.cost.costUsd;
        confidence = 0.85;
        costInfo = groqResult.cost.tokens + ' tokens | $' + groqResult.cost.costUsd.toFixed(6);
      }
    }
    else if (KIMI_API_KEY.length > 10) {
      const kimiResult = await kimiChat([
        { role: 'system', content: 'You are ASIS, the M-Theory intelligence engine for MTAA OS.' },
        { role: 'user', content: query },
      ]);

      if (!kimiResult.error) {
        responseText = kimiResult.text;
        source = 'kimi';
        this.network.kimiRequests++;
        this.network.totalTokensUsed += kimiResult.tokens || 0;
        confidence = 0.85;
      } else {
        responseText = 'Kimi Error: ' + kimiResult.error + '\n\nFalling back to M-Theory: This query requires cloud AI. Please recharge your Kimi account or configure Groq for free tier access.';
        source = 'mtheory_fallback';
        confidence = 0.3;
      }
    }
    else {
      responseText = 'This query requires cloud AI capabilities.\n\nM-Theory handles math and code locally, but complex reasoning requires:\n\n1. **Groq** (Free tier): Sign up at console.groq.com, get API key, add to .env\n2. **Kimi** (Paid): Recharge at platform.moonshot.cn\n\nCurrent query complexity: ' + complexity.toFixed(2) + ' (requires cloud AI)';
      source = 'mtheory_limited';
      confidence = 0.2;
    }

    const nodeId = 'interaction_' + this.network.interactionCount;
    const growthFactor = computeGrowthFactor(
      this.network.interactionCount,
      this.network.nodes.size,
      confidence
    );

    this.network.nodes.set(nodeId, {
      id: nodeId,
      query: query,
      domain: domain,
      capability: source,
      confidence: confidence,
      growthFactor: growthFactor,
      timestamp: new Date(),
      source: source,
    });

    return {
      text: responseText,
      growthFactor: parseFloat(growthFactor.toFixed(3)),
      confidence: parseFloat(confidence.toFixed(2)),
      domain: domain,
      source: source,
      timing: Date.now() - start,
      cost: costInfo || undefined,
    };
  }

  async healthCheck() {
    const groqHealth = await groqClient.healthCheck();

    let kimiHealth = { ok: false, error: 'Not configured' };
    if (KIMI_API_KEY.length > 10) {
      const result = await kimiChat([{ role: 'user', content: 'Hi' }]);
      kimiHealth = { ok: !result.error, error: result.error };
    }

    return {
      mtheory: true,
      groq: groqHealth,
      kimi: kimiHealth,
    };
  }
}

export default AsisV3Engine;
