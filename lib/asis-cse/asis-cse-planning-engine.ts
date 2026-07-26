/**
 * ASIS CSE — Planning Engine (Engine 14)
 * Specification: 14_PLANNING_ENGINE.md
 * 
 * Transforms decisions into executable plans.
 * Bridges cognition and action through task decomposition and resource allocation.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  Decision,
  ExecutionPlan,
  Task,
  Milestone,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, PLANNING_MAX_TASKS } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface PlanningEngineState {
  activePlans: Map<string, ExecutionPlan>;
  completedPlans: ExecutionPlan[];
  taskRegistry: Map<string, Task>;
}

export class PlanningEngine implements CognitiveEngine {
  readonly id = 'planning-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['task-decomposition', 'resource-allocation', 'dependency-management', 'contingency-planning', 'dynamic-replanning'];

  private state: PlanningEngineState;

  constructor() {
    this.state = {
      activePlans: new Map(),
      completedPlans: [],
      taskRegistry: new Map(),
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const decision = context.inputs?.decision as Decision | undefined;

    if (!decision || !decision.selectedStrategy) {
      return this.buildResult([], 0, startTime, 'No decision provided for planning');
    }

    const strategy = decision.selectedStrategy;
    const resources = context.inputs?.resources || {};
    const constraints = context.inputs?.constraints || {};
    const identity = context.inputs?.identity || {};

    // Decompose objective into tasks
    const tasks = await this.decomposeObjective(strategy, resources, constraints, context);

    // Sequence tasks based on dependencies
    const sequencedTasks = this.sequenceTasks(tasks);

    // Allocate resources
    const allocatedTasks = this.allocateResources(sequencedTasks, resources);

    // Build milestones
    const milestones = this.buildMilestones(allocatedTasks, strategy);

    // Create contingency and fallback plans
    const fallbackPlan = this.buildFallbackPlan(allocatedTasks, constraints);
    const rollbackPlan = this.buildRollbackPlan(allocatedTasks);

    const plan: ExecutionPlan = {
      id: uuidv4(),
      name: `Plan for: ${strategy.name}`,
      objective: strategy.description,
      tasks: allocatedTasks,
      milestones,
      dependencies: this.extractDependencies(allocatedTasks),
      executionOrder: allocatedTasks.map(t => t.id),
      requiredResources: this.summariseResources(allocatedTasks),
      successMetrics: this.defineSuccessMetrics(strategy, decision),
      fallbackPlan,
      rollbackPlan,
      priority: decision.priority || 0.5,
      estimatedDuration: this.estimateDuration(allocatedTasks),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'ready',
    };

    this.state.activePlans.set(plan.id, plan);
    for (const task of allocatedTasks) {
      this.state.taskRegistry.set(task.id, task);
    }

    const planningOutput = {
      plan,
      taskCount: allocatedTasks.length,
      criticalPath: this.identifyCriticalPath(allocatedTasks),
      riskPoints: this.identifyRiskPoints(allocatedTasks),
      resourceGaps: this.identifyResourceGaps(allocatedTasks, resources),
    };

    return this.buildResult(
      [planningOutput],
      decision.confidence.overall,
      startTime,
      `Decomposed '${strategy.name}' into ${allocatedTasks.length} tasks across ${milestones.length} milestones. Estimated duration: ${plan.estimatedDuration}ms. Fallback and rollback plans included.`
    );
  }

  private async decomposeObjective(
    strategy: any,
    resources: any,
    constraints: any,
    context: EngineContext
  ): Promise<Task[]> {
    const tasks: Task[] = [];
    const objective = strategy.description || 'Execute strategy';

    // Phase 1: Preparation
    tasks.push({
      id: uuidv4(),
      name: 'validate-preconditions',
      description: 'Verify all preconditions before execution',
      type: 'validation',
      dependencies: [],
      estimatedDuration: 1000,
      requiredResources: ['validation-service'],
      assignedTo: null,
      status: 'pending',
      priority: 1.0,
      retryPolicy: { maxRetries: 2, backoffMs: 500 },
      createdAt: Date.now(),
    });

    // Phase 2: Core execution tasks based on strategy type
    const coreTasks = this.inferCoreTasks(strategy);
    for (const coreTask of coreTasks.slice(0, PLANNING_MAX_TASKS - 4)) {
      tasks.push({
        id: uuidv4(),
        name: coreTask.name,
        description: coreTask.description,
        type: coreTask.type,
        dependencies: tasks.length > 0 ? [tasks[tasks.length - 1].id] : [],
        estimatedDuration: coreTask.duration || 5000,
        requiredResources: coreTask.resources || ['compute'],
        assignedTo: null,
        status: 'pending',
        priority: coreTask.priority || 0.7,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        createdAt: Date.now(),
      });
    }

    // Phase 3: Verification
    tasks.push({
      id: uuidv4(),
      name: 'verify-outcomes',
      description: 'Validate that objectives were achieved',
      type: 'verification',
      dependencies: tasks.length > 0 ? [tasks[tasks.length - 1].id] : [],
      estimatedDuration: 2000,
      requiredResources: ['verification-service'],
      assignedTo: null,
      status: 'pending',
      priority: 0.9,
      retryPolicy: { maxRetries: 1, backoffMs: 500 },
      createdAt: Date.now(),
    });

    // Phase 4: Feedback capture
    tasks.push({
      id: uuidv4(),
      name: 'capture-feedback',
      description: 'Record execution outcomes for learning',
      type: 'feedback',
      dependencies: [tasks[tasks.length - 1].id],
      estimatedDuration: 1000,
      requiredResources: ['memory-service'],
      assignedTo: null,
      status: 'pending',
      priority: 0.6,
      retryPolicy: { maxRetries: 2, backoffMs: 500 },
      createdAt: Date.now(),
    });

    return tasks;
  }

  private inferCoreTasks(strategy: any): any[] {
    const tasks = [];
    const desc = (strategy.description || '').toLowerCase();

    if (desc.includes('predict') || desc.includes('forecast')) {
      tasks.push({ name: 'gather-data', description: 'Collect relevant data for prediction', type: 'data-collection', duration: 3000, resources: ['data-source'], priority: 0.8 });
      tasks.push({ name: 'build-model', description: 'Construct predictive model', type: 'computation', duration: 5000, resources: ['compute'], priority: 0.9 });
      tasks.push({ name: 'run-prediction', description: 'Execute prediction algorithm', type: 'computation', duration: 4000, resources: ['compute'], priority: 0.9 });
    } else if (desc.includes('search') || desc.includes('find')) {
      tasks.push({ name: 'formulate-query', description: 'Translate objective into search query', type: 'translation', duration: 2000, resources: ['search-service'], priority: 0.8 });
      tasks.push({ name: 'execute-search', description: 'Perform search across sources', type: 'retrieval', duration: 4000, resources: ['search-service', 'network'], priority: 0.9 });
      tasks.push({ name: 'rank-results', description: 'Rank and filter search results', type: 'computation', duration: 3000, resources: ['compute'], priority: 0.7 });
    } else if (desc.includes('create') || desc.includes('build') || desc.includes('generate')) {
      tasks.push({ name: 'design-structure', description: 'Design the structure of the output', type: 'design', duration: 4000, resources: ['compute'], priority: 0.9 });
      tasks.push({ name: 'generate-content', description: 'Generate the core content', type: 'generation', duration: 6000, resources: ['compute', 'model'], priority: 0.9 });
      tasks.push({ name: 'review-quality', description: 'Review output quality', type: 'validation', duration: 3000, resources: ['compute'], priority: 0.8 });
    } else {
      tasks.push({ name: 'analyse-context', description: 'Analyse current context and requirements', type: 'analysis', duration: 3000, resources: ['compute'], priority: 0.8 });
      tasks.push({ name: 'execute-action', description: 'Execute the primary action', type: 'execution', duration: 5000, resources: ['execution-service'], priority: 0.9 });
      tasks.push({ name: 'monitor-progress', description: 'Monitor execution progress', type: 'monitoring', duration: 4000, resources: ['monitoring-service'], priority: 0.7 });
    }

    return tasks;
  }

  private sequenceTasks(tasks: Task[]): Task[] {
    // Topological sort based on dependencies
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    const ordered: Task[] = [];

    function visit(taskId: string) {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      const task = taskMap.get(taskId);
      if (task) {
        for (const depId of task.dependencies) {
          visit(depId);
        }
        ordered.push(task);
      }
    }

    for (const task of tasks) {
      visit(task.id);
    }

    return ordered;
  }

  private allocateResources(tasks: Task[], resources: any): Task[] {
    const availableResources = new Set(Object.keys(resources));
    return tasks.map(task => ({
      ...task,
      canExecute: task.requiredResources.every(r => availableResources.has(r) || r === 'compute'),
      resourceStatus: task.requiredResources.map(r => ({
        resource: r,
        available: availableResources.has(r) || r === 'compute',
      })),
    }));
  }

  private buildMilestones(tasks: Task[], strategy: any): Milestone[] {
    const milestones: Milestone[] = [];
    const chunkSize = Math.max(2, Math.ceil(tasks.length / 3));

    for (let i = 0; i < tasks.length; i += chunkSize) {
      const chunk = tasks.slice(i, i + chunkSize);
      milestones.push({
        id: uuidv4(),
        name: `Milestone ${Math.floor(i / chunkSize) + 1}`,
        description: `Complete ${chunk.map(t => t.name).join(', ')}`,
        tasks: chunk.map(t => t.id),
        criteria: `All tasks in phase ${Math.floor(i / chunkSize) + 1} completed successfully`,
        deadline: null,
        status: 'pending',
      });
    }

    return milestones;
  }

  private extractDependencies(tasks: Task[]): any[] {
    return tasks.flatMap(task =>
      task.dependencies.map(depId => ({
        from: depId,
        to: task.id,
        type: 'required',
      }))
    );
  }

  private summariseResources(tasks: Task[]): any {
    const allResources = new Set(tasks.flatMap(t => t.requiredResources));
    return {
      totalTypes: allResources.size,
      types: [...allResources],
      estimatedCompute: tasks.filter(t => t.requiredResources.includes('compute')).length * 5000,
    };
  }

  private defineSuccessMetrics(strategy: any, decision: Decision): any {
    return {
      primary: strategy.description || 'objective-achieved',
      confidence: decision.confidence.overall,
      maxRisk: 0.5,
      maxDuration: 60000,
      ethicalClearance: true,
    };
  }

  private buildFallbackPlan(tasks: Task[], constraints: any): any {
    return {
      trigger: 'primary-plan-failure',
      actions: tasks.slice(0, Math.min(3, tasks.length)).map(t => ({
        taskId: t.id,
        fallbackAction: 'retry-with-reduced-scope',
        maxAttempts: 2,
      })),
      notificationTargets: ['feedback-engine', 'reflection-engine'],
    };
  }

  private buildRollbackPlan(tasks: Task[]): any {
    return {
      trigger: 'critical-failure',
      steps: [...tasks].reverse().map(t => ({
        taskId: t.id,
        rollbackAction: 'undo-changes',
        preserveState: true,
      })),
      stateSnapshotRequired: true,
    };
  }

  private estimateDuration(tasks: Task[]): number {
    return tasks.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);
  }

  private identifyCriticalPath(tasks: Task[]): string[] {
    // Simplified: longest chain of dependencies
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const pathLengths = new Map<string, number>();

    function getPathLength(taskId: string): number {
      if (pathLengths.has(taskId)) return pathLengths.get(taskId)!;
      const task = taskMap.get(taskId);
      if (!task || task.dependencies.length === 0) {
        pathLengths.set(taskId, 1);
        return 1;
      }
      const maxDepLength = Math.max(...task.dependencies.map(getPathLength));
      const length = maxDepLength + 1;
      pathLengths.set(taskId, length);
      return length;
    }

    for (const task of tasks) {
      getPathLength(task.id);
    }

    const maxLength = Math.max(...pathLengths.values());
    return tasks.filter(t => pathLengths.get(t.id) === maxLength).map(t => t.id);
  }

  private identifyRiskPoints(tasks: Task[]): any[] {
    return tasks
      .filter(t => t.type === 'execution' || t.type === 'computation')
      .map(t => ({
        taskId: t.id,
        risk: t.retryPolicy.maxRetries > 2 ? 'medium' : 'high',
        mitigation: `Retry up to ${t.retryPolicy.maxRetries} times with ${t.retryPolicy.backoffMs}ms backoff`,
      }));
  }

  private identifyResourceGaps(tasks: Task[], resources: any): any[] {
    const available = new Set(Object.keys(resources));
    const gaps: any[] = [];

    for (const task of tasks) {
      for (const resource of task.requiredResources) {
        if (!available.has(resource) && resource !== 'compute') {
          gaps.push({ taskId: task.id, missingResource: resource });
        }
      }
    }

    return gaps;
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

  getActivePlans(): ExecutionPlan[] {
    return [...this.state.activePlans.values()];
  }

  getPlan(planId: string): ExecutionPlan | undefined {
    return this.state.activePlans.get(planId);
  }
}
