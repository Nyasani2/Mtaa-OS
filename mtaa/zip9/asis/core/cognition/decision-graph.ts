// ============================================================
// DECISION GRAPH — Core reasoning structure
// Branching, weighted paths, fallback nodes, risk evaluation
// Explainability output: "why ASIS chose this path"
// ============================================================

import { IDecisionGraph } from './interfaces';
import { DecisionGraph, DecisionNode, CognitiveState, ExecutionPath } from './types';

export class DecisionGraphEngine implements IDecisionGraph {
  create(initialState: CognitiveState): DecisionGraph {
    const rootId = 'node_root';
    const root: DecisionNode = {
      id: rootId,
      type: 'condition',
      label: 'Evaluate intent confidence',
      condition: (state) => state.intent !== null,
      weight: 1.0,
      children: ['node_high_conf', 'node_medium_conf', 'node_low_conf'],
      executed: false,
    };

    const highConf: DecisionNode = {
      id: 'node_high_conf',
      type: 'condition',
      label: 'Confidence >= high?',
      condition: (state) => ['certain', 'high'].includes(state.intent?.confidence || ''),
      weight: 0.9,
      children: ['node_direct_exec', 'node_safety_gate'],
      parent: rootId,
      executed: false,
    };

    const mediumConf: DecisionNode = {
      id: 'node_medium_conf',
      type: 'condition',
      label: 'Confidence == medium?',
      condition: (state) => state.intent?.confidence === 'medium',
      weight: 0.6,
      children: ['node_clarify', 'node_safety_gate'],
      parent: rootId,
      executed: false,
    };

    const lowConf: DecisionNode = {
      id: 'node_low_conf',
      type: 'condition',
      label: 'Confidence <= low?',
      condition: (state) => ['low', 'unknown'].includes(state.intent?.confidence || ''),
      weight: 0.3,
      children: ['node_navigator', 'node_safety_gate'],
      parent: rootId,
      executed: false,
    };

    const directExec: DecisionNode = {
      id: 'node_direct_exec',
      type: 'action',
      label: 'Direct execution path',
      action: async (state) => state,
      weight: 1.0,
      children: ['node_safety_gate'],
      parent: 'node_high_conf',
      executed: false,
    };

    const clarify: DecisionNode = {
      id: 'node_clarify',
      type: 'action',
      label: 'Request clarification',
      action: async (state) => {
        // Add clarification to response plan
        return state;
      },
      weight: 0.7,
      children: ['node_safety_gate'],
      parent: 'node_medium_conf',
      executed: false,
    };

    const navigator: DecisionNode = {
      id: 'node_navigator',
      type: 'fallback',
      label: 'Navigator fallback',
      action: async (state) => state,
      weight: 0.5,
      children: ['node_safety_gate'],
      parent: 'node_low_conf',
      executed: false,
    };

    const safetyGate: DecisionNode = {
      id: 'node_safety_gate',
      type: 'risk_eval',
      label: 'Safety checkpoint',
      riskLevel: 'safe',
      weight: 1.0,
      children: ['node_merge'],
      executed: false,
    };

    const merge: DecisionNode = {
      id: 'node_merge',
      type: 'merge',
      label: 'Merge all paths',
      weight: 1.0,
      children: [],
      executed: false,
    };

    const nodes = new Map<string, DecisionNode>();
    [root, highConf, mediumConf, lowConf, directExec, clarify, navigator, safetyGate, merge].forEach(n => nodes.set(n.id, n));

    return {
      id: `graph_${Date.now()}`,
      rootNodeId: rootId,
      nodes,
      currentNodeId: rootId,
      path: [],
      explainability: [],
    };
  }

  async traverse(graph: DecisionGraph, state: CognitiveState): Promise<DecisionGraph> {
    let current = graph.nodes.get(graph.currentNodeId);
    if (!current) return graph;

    const path: string[] = [];
    const explainability: string[] = [];

    while (current) {
      path.push(current.id);
      current.executed = true;

      // Execute node logic
      if (current.type === 'condition' && current.condition) {
        const result = current.condition(state);
        explainability.push(`[${current.label}] Condition evaluated: ${result}`);

        if (result && current.children.length > 0) {
          current = graph.nodes.get(current.children[0]);
          continue;
        } else if (!result && current.children.length > 1) {
          current = graph.nodes.get(current.children[1]);
          continue;
        }
      }

      if (current.type === 'action' && current.action) {
        explainability.push(`[${current.label}] Executing action`);
        try {
          state = await current.action(state);
          current.result = 'success';
        } catch (err) {
          current.result = 'failure';
          explainability.push(`[${current.label}] Action failed: ${err}`);
          // Try fallback child
          const fallbackChild = current.children.find(c => {
            const child = graph.nodes.get(c);
            return child?.type === 'fallback';
          });
          if (fallbackChild) {
            current = graph.nodes.get(fallbackChild);
            continue;
          }
        }
      }

      if (current.type === 'risk_eval') {
        const risk = this.evaluateRisk(graph, state);
        current.riskLevel = risk as any;
        explainability.push(`[${current.label}] Risk evaluated: ${risk}`);
      }

      // Move to next child
      if (current.children.length > 0) {
        // Select highest weight child
        const children = current.children
          .map(c => graph.nodes.get(c))
          .filter(Boolean) as DecisionNode[];
        const next = children.sort((a, b) => b.weight - a.weight)[0];
        current = next;
      } else {
        current = undefined;
      }
    }

    return {
      ...graph,
      path,
      explainability,
      currentNodeId: path[path.length - 1] || graph.rootNodeId,
    };
  }

  addNode(graph: DecisionGraph, node: DecisionNode): void {
    graph.nodes.set(node.id, node);
  }

  getExplainability(graph: DecisionGraph): string[] {
    return [...graph.explainability];
  }

  evaluateRisk(graph: DecisionGraph, state: CognitiveState): string {
    // Evaluate risk based on intent domain and confidence
    const domain = state.intent?.primaryIntent.domain;
    const confidence = state.intent?.confidence;

    if (domain === 'wallet' || domain === 'health') {
      if (confidence === 'low' || confidence === 'unknown') return 'danger';
      return 'caution';
    }
    if (domain === 'transport' && state.intent?.primaryIntent.name === 'book_ride') {
      return 'safe';
    }
    return 'safe';
  }
}
