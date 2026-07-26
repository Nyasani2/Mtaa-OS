/**
 * ASIS CSE — Collective Intelligence Engine (Engine 21)
 * Specification: 21_COLLECTIVE_INTELLIGENCE_ENGINE.md
 * 
 * Enables multiple ASIS instances to learn together while preserving independence.
 * Collective Intelligence emerges through collaboration, not centralisation.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  WisdomReport,
  CollectiveMemory,
  ConsensusReport,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, COLLECTIVE_VALIDATION_THRESHOLD } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface CollectiveEngineState {
  localNodeId: string;
  peerNodes: Map<string, any>;
  collectiveMemory: CollectiveMemory;
  consensusHistory: ConsensusReport[];
  sharedKnowledge: Map<string, any>;
}

export class CollectiveIntelligenceEngine implements CognitiveEngine {
  readonly id = 'collective-intelligence-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['knowledge-sharing', 'discovery-merging', 'disagreement-resolution', 'consensus-building', 'collective-memory-maintenance', 'distributed-cognition-coordination'];

  private state: CollectiveEngineState;

  constructor(nodeId?: string) {
    this.state = {
      localNodeId: nodeId || uuidv4(),
      peerNodes: new Map(),
      collectiveMemory: {
        id: uuidv4(),
        entries: [],
        version: '1.0.0',
        lastUpdated: Date.now(),
        nodeCount: 1,
      },
      consensusHistory: [],
      sharedKnowledge: new Map(),
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const wisdom = context.inputs?.wisdom as any | undefined;
    const localKnowledge = context.inputs?.localKnowledge || {};
    const peerUpdates = context.inputs?.peerUpdates || [];

    // Merge validated local knowledge into collective memory
    const localContributions = await this.prepareLocalContributions(localKnowledge, wisdom);

    // Process peer updates
    const peerContributions = await this.processPeerUpdates(peerUpdates);

    // Build consensus on shared knowledge
    const consensus = await this.buildConsensus(localContributions, peerContributions);

    // Resolve disagreements
    const resolutions = await this.resolveDisagreements(consensus);

    // Update collective memory
    const memoryUpdate = await this.updateCollectiveMemory(consensus, resolutions);

    // Coordinate distributed cognition
    const coordination = this.coordinateDistributedCognition(context);

    const collectiveOutput = {
      localNodeId: this.state.localNodeId,
      contributionsSubmitted: localContributions.length,
      peerContributionsReceived: peerContributions.length,
      consensusEntries: consensus.entries.length,
      disagreementsResolved: resolutions.length,
      collectiveMemorySize: this.state.collectiveMemory.entries.length,
      coordinationPlan: coordination,
      sharedPolicies: this.extractSharedPolicies(),
    };

    return this.buildResult(
      [collectiveOutput],
      consensus.confidence,
      startTime,
      `Collective intelligence cycle: ${localContributions.length} local contributions, ${peerContributions.length} peer contributions, ${consensus.entries.length} consensus entries, ${resolutions.length} disagreements resolved.`
    );
  }

  private async prepareLocalContributions(localKnowledge: any, wisdom: any): Promise<any[]> {
    const contributions = [];

    if (wisdom?.report) {
      const wisdomReport = wisdom.report as WisdomReport;
      if (wisdomReport.confidence >= COLLECTIVE_VALIDATION_THRESHOLD) {
        contributions.push({
          id: uuidv4(),
          nodeId: this.state.localNodeId,
          type: 'wisdom',
          content: {
            recommendation: wisdomReport.recommendation,
            ethicalClearance: wisdomReport.ethicalClearance,
            longTermAssessment: wisdomReport.longTermAssessment,
          },
          confidence: wisdomReport.confidence,
          evidence: [],
          reflectionHistory: [],
          validationStatus: 'pending',
          timestamp: Date.now(),
        });
      }
    }

    if (localKnowledge.patterns) {
      for (const pattern of localKnowledge.patterns) {
        if (pattern.confidence >= COLLECTIVE_VALIDATION_THRESHOLD) {
          contributions.push({
            id: uuidv4(),
            nodeId: this.state.localNodeId,
            type: 'pattern',
            content: pattern,
            confidence: pattern.confidence,
            evidence: pattern.entities || [],
            reflectionHistory: [],
            validationStatus: 'pending',
            timestamp: Date.now(),
          });
        }
      }
    }

    return contributions;
  }

  private async processPeerUpdates(updates: any[]): Promise<any[]> {
    const contributions = [];

    for (const update of updates) {
      if (update.nodeId === this.state.localNodeId) continue;

      this.state.peerNodes.set(update.nodeId, {
        lastSeen: Date.now(),
        trustScore: update.trustScore || 0.5,
        capabilities: update.capabilities || [],
      });

      for (const contribution of update.contributions || []) {
        // Validate peer contribution
        const validated = await this.validatePeerContribution(contribution, update.nodeId);
        if (validated) {
          contributions.push({
            ...contribution,
            sourceNode: update.nodeId,
            receivedAt: Date.now(),
          });
        }
      }
    }

    return contributions;
  }

  private async validatePeerContribution(contribution: any, peerId: string): Promise<boolean> {
    const peer = this.state.peerNodes.get(peerId);
    if (!peer) return false;

    // Trust-weighted validation
    const trustWeight = peer.trustScore;
    const confidenceThreshold = COLLECTIVE_VALIDATION_THRESHOLD * (1 + (1 - trustWeight) * 0.5);

    return contribution.confidence >= confidenceThreshold &&
           contribution.evidence && contribution.evidence.length > 0;
  }

  private async buildConsensus(local: any[], peer: any[]): Promise<any> {
    const allContributions = [...local, ...peer];
    const groupedByType = new Map<string, any[]>();

    for (const contrib of allContributions) {
      if (!groupedByType.has(contrib.type)) groupedByType.set(contrib.type, []);
      groupedByType.get(contrib.type)!.push(contrib);
    }

    const consensusEntries = [];
    let totalConfidence = 0;

    for (const [type, contributions] of groupedByType) {
      if (contributions.length >= 2) {
        // Find overlapping evidence
        const evidenceSets = contributions.map(c => new Set(c.evidence || []));
        const commonEvidence = [...evidenceSets[0]].filter(e => 
          evidenceSets.every(set => set.has(e))
        );

        const avgConfidence = contributions.reduce((sum, c) => sum + c.confidence, 0) / contributions.length;
        const agreementStrength = commonEvidence.length / Math.max(...evidenceSets.map(s => s.size));

        const consensusConfidence = avgConfidence * (0.5 + 0.5 * agreementStrength) * COUPLING;

        consensusEntries.push({
          id: uuidv4(),
          type,
          content: this.mergeContributions(contributions),
          supportingNodes: contributions.map(c => c.nodeId || c.sourceNode),
          confidence: consensusConfidence,
          agreementStrength,
          commonEvidence,
          timestamp: Date.now(),
          status: 'consensus',
        });

        totalConfidence += consensusConfidence;
      }
    }

    return {
      id: uuidv4(),
      entries: consensusEntries,
      confidence: consensusEntries.length > 0 ? totalConfidence / consensusEntries.length : 0,
      totalContributions: allContributions.length,
      consensusCount: consensusEntries.length,
      timestamp: Date.now(),
    };
  }

  private mergeContributions(contributions: any[]): any {
    if (contributions.length === 0) return {};
    if (contributions.length === 1) return contributions[0].content;

    // Merge by averaging confidence-weighted values
    const merged: any = { ...contributions[0].content };
    let totalWeight = contributions[0].confidence;

    for (let i = 1; i < contributions.length; i++) {
      const c = contributions[i];
      const weight = c.confidence;
      totalWeight += weight;

      for (const key of Object.keys(c.content)) {
        if (typeof c.content[key] === 'number' && typeof merged[key] === 'number') {
          merged[key] = (merged[key] * (totalWeight - weight) + c.content[key] * weight) / totalWeight;
        } else if (!merged[key]) {
          merged[key] = c.content[key];
        }
      }
    }

    return merged;
  }

  private async resolveDisagreements(consensus: any): Promise<any[]> {
    const resolutions = [];
    const entries = consensus.entries || [];

    // Find competing models for same type
    const typeGroups = new Map<string, any[]>();
    for (const entry of entries) {
      if (!typeGroups.has(entry.type)) typeGroups.set(entry.type, []);
      typeGroups.get(entry.type)!.push(entry);
    }

    for (const [type, group] of typeGroups) {
      if (group.length > 1) {
        // Maintain competing models, let reality decide
        resolutions.push({
          id: uuidv4(),
          type: 'competing-models-preserved',
          description: `Multiple models for ${type} maintained; reality will determine survival`,
          models: group.map((g: any) => g.id),
          resolutionStrategy: 'evidence-driven-selection',
          confidence: Math.max(...group.map((g: any) => g.confidence)),
          timestamp: Date.now(),
        });
      }
    }

    return resolutions;
  }

  private async updateCollectiveMemory(consensus: any, resolutions: any[]): Promise<any> {
    const newEntries = consensus.entries.map((entry: any) => ({
      ...entry,
      id: uuidv4(),
      addedAt: Date.now(),
      validationChain: [this.state.localNodeId],
    }));

    this.state.collectiveMemory.entries.push(...newEntries);
    this.state.collectiveMemory.lastUpdated = Date.now();
    this.state.collectiveMemory.nodeCount = this.state.peerNodes.size + 1;

    for (const entry of newEntries) {
      this.state.sharedKnowledge.set(entry.id, entry);
    }

    return {
      entriesAdded: newEntries.length,
      totalEntries: this.state.collectiveMemory.entries.length,
      memoryVersion: this.state.collectiveMemory.version,
    };
  }

  private coordinateDistributedCognition(context: EngineContext): any {
    const specialisations = new Map<string, string[]>();

    for (const [nodeId, node] of this.state.peerNodes) {
      for (const capability of node.capabilities || []) {
        if (!specialisations.has(capability)) specialisations.set(capability, []);
        specialisations.get(capability)!.push(nodeId);
      }
    }

    return {
      localCapabilities: this.capabilities,
      distributedTasks: this.identifyDistributableTasks(context, specialisations),
      specialisationMap: Object.fromEntries(specialisations),
      autonomyPreserved: true,
    };
  }

  private identifyDistributableTasks(context: EngineContext, specialisations: Map<string, string[]>): any[] {
    const tasks = [];
    const requestedCapability = context.inputs?.requestedCapability;

    if (requestedCapability && specialisations.has(requestedCapability)) {
      const capableNodes = specialisations.get(requestedCapability)!;
      tasks.push({
        task: requestedCapability,
        assignedTo: capableNodes[0],
        backupNodes: capableNodes.slice(1),
        reason: 'specialised-capability',
      });
    }

    return tasks;
  }

  private extractSharedPolicies(): any[] {
    const policies = [];
    for (const entry of this.state.collectiveMemory.entries) {
      if (entry.type === 'wisdom' && entry.content?.ethicalClearance) {
        policies.push({
          source: entry.id,
          policy: 'ethical-clearance-standard',
          value: entry.content.ethicalClearance,
          confidence: entry.confidence,
        });
      }
    }
    return policies;
  }

  private buildResult(outputs: any[], confidence: number, startTime: number, explanation: string): EngineResult {
    return {
      engineId: this.id,
      outputs,
      confidence: { overall: confidence, logical: confidence, evidence: confidence },
      processingTime: Date.now() - startTime,
      explanation,
      traceId: uuidv4(),
      timestamp: Date.now(),
    };
  }

  getCollectiveMemory(): CollectiveMemory {
    return this.state.collectiveMemory;
  }

  getConsensusHistory(): ConsensusReport[] {
    return this.state.consensusHistory;
  }

  getLocalNodeId(): string {
    return this.state.localNodeId;
  }
}
