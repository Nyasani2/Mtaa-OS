import { v4 as uuidv4 } from 'uuid';
import { CognitiveEngine, EngineContext, EngineResult, KnowledgeGraph, MentalModel, CausalLink, Pattern } from './asis-cse-types';
import { COUPLING } from './asis-cse-constants';

export class UnderstandingEngine implements CognitiveEngine {
  readonly id = 'understanding-engine';
  readonly name = 'UnderstandingEngine';
  readonly version = '1.0.0';
  readonly status: 'active' | 'inactive' | 'error' = 'active';
  readonly capabilities = ['mental-model-construction', 'causality-detection', 'pattern-recognition'];

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const knowledgeGraph = context.inputs?.knowledgeGraph as KnowledgeGraph | undefined;

    if (!knowledgeGraph || knowledgeGraph.nodes.length === 0) {
      return this.buildResult([], 0, startTime, 'No knowledge graph provided');
    }

    const models: MentalModel[] = knowledgeGraph.nodes.map((n: any) => ({
      id: uuidv4(), name: n.label || 'Model', domain: 'general', description: 'Auto-generated',
      entities: [n.id], relationships: [], dynamics: ['relational'],
      confidence: typeof n.confidence === 'object' ? n.confidence.overall : 0.8,
      createdAt: Date.now()
    }));

    const links: CausalLink[] = knowledgeGraph.edges
      .filter((e: any) => e.type === 'causes' || e.type === 'governs')
      .map((e: any) => ({
        id: uuidv4(), cause: e.source, effect: e.target, strength: 0.5,
        confidence: typeof e.confidence === 'object' ? e.confidence.overall * COUPLING : 0.5,
        mechanism: e.type, conditions: [], validated: false, discoveredAt: Date.now()
      }));

    const patterns: Pattern[] = [{
      id: uuidv4(), name: 'structural-pattern', domain: 'general', description: 'Detected structure',
      type: 'structural', frequency: 1, entities: [], confidence: 0.7, firstObserved: Date.now(), lastObserved: Date.now()
    }];

    const avgConfidence = models.reduce((sum, m) => sum + (typeof m.confidence === 'object' ? m.confidence.overall : m.confidence), 0) / models.length;

    return this.buildResult([{ mentalModels: models, causalNetwork: links, patterns }], avgConfidence, startTime, 'Constructed models');
  }

  private buildResult(output: any[], confidence: number, startTime: number, explanation: string): EngineResult {
    return { engineId: this.id, output, confidence: { overall: confidence, logical: confidence, evidence: confidence }, processingTime: Date.now() - startTime, explanation, traceId: uuidv4(), timestamp: Date.now() };
  }
}
