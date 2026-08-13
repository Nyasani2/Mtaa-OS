// @ts-nocheck
/**
 * ASIS CSE — Purpose Engine
 * "Why should cognition happen?" — Defines objectives and success criteria.
 * Transforms requests into measurable, prioritized goals.
 */

import { BaseEngine } from './asis-cse-kernel';
import { globalMemoryStore, createMemory } from './asis-cse-memory';

import type {
  EngineId,
  CognitiveInput,
  CognitiveOutput,
} from './asis-cse-types';

export type GoalCategory =
  | 'knowledge'
  | 'decision'
  | 'prediction'
  | 'learning'
  | 'creative'
  | 'safety'
  | 'operational'
  | 'strategic'
  | 'social'
  | 'economic';

export interface Goal {
  id: string;
  primary: string;
  secondary: string[];
  category: GoalCategory;
  constraints: Constraint[];
  priority: number; // 1-100, lower = higher priority
  deadline: number | null;
  successCriteria: string[];
  acceptableRisk: number; // 0-1
  requiredConfidence: number; // 0-1
  status: 'active' | 'paused' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
}

export interface Constraint {
  type: 'time' | 'resource' | 'ethical' | 'legal' | 'technical' | 'budget';
  description: string;
  strict: boolean;
  weight: number;
}

export class PurposeEngine extends BaseEngine {
  readonly id: EngineId = 'purpose';
  private goals: Map<string, Goal> = new Map();
  private activeGoalId: string | null = null;

  constructor() {
    super();
    this.config.priority = 15;
    this.config.dependencies = ['identity'];
  }

  async process(input: CognitiveInput): Promise<CognitiveOutput> {
    const startTime = Date.now();
    const { payload } = input;

    const action = (payload as Record<string, unknown>)?.action as string;

    let result: unknown;
    const confidence = 0.85;

    switch (action) {
      case 'define':
        result = this.defineGoal(payload as Record<string, unknown>);
        break;
      case 'prioritize':
        result = this.prioritizeGoals();
        break;
      case 'resolve_conflict':
        result = this.resolveConflicts();
        break;
      case 'get_active':
        result = this.getActiveGoal();
        break;
      case 'complete':
        result = this.completeGoal((payload as Record<string, unknown>)?.goalId as string);
        break;
      default:
        result = this.getActiveGoal();
    }

    // Store purpose context
    const mem = createMemory(
      'working',
      {
        activeGoal: this.activeGoalId,
        goalCount: this.goals.size,
        action,
      },
      {
        source: 'purpose',
        confidence,
        salience: 0.7,
        tags: ['purpose', 'goal'],
      }
    );
    globalMemoryStore.store(mem);

    return {
      id: `out_${Date.now()}`,
      engineId: this.id,
      inputId: input.id,
      type: 'purpose_context',
      payload: result,
      confidence,
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  private defineGoal(data: Record<string, unknown>): Goal {
    const goal: Goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      primary: data.primary as string ?? 'undefined',
      secondary: (data.secondary as string[]) ?? [],
      category: (data.category as GoalCategory) ?? 'knowledge',
      constraints: (data.constraints as Constraint[]) ?? [],
      priority: data.priority as number ?? 50,
      deadline: data.deadline as number ?? null,
      successCriteria: (data.successCriteria as string[]) ?? [],
      acceptableRisk: data.acceptableRisk as number ?? 0.3,
      requiredConfidence: data.requiredConfidence as number ?? 0.7,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.goals.set(goal.id, goal);

    // Auto-activate if highest priority
    if (!this.activeGoalId || goal.priority < (this.getActiveGoal()?.priority ?? 0)) {
      this.activeGoalId = goal.id;
    }

    return goal;
  }

  private prioritizeGoals(): Goal[] {
    const sorted = Array.from(this.goals.values())
      .filter((g) => g.status === 'active')
      .sort((a, b) => {
        // Priority first, then deadline urgency
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.deadline && b.deadline) return a.deadline - b.deadline;
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return 0;
      });

    if (sorted.length > 0) {
      this.activeGoalId = sorted[0].id;
    }

    return sorted;
  }

  private resolveConflicts(): { winner: string; losers: string[]; reason: string } {
    const active = Array.from(this.goals.values()).filter((g) => g.status === 'active');
    if (active.length < 2) {
      return { winner: this.activeGoalId ?? 'none', losers: [], reason: 'no_conflict' };
    }

    // Sort by priority
    const sorted = active.sort((a, b) => a.priority - b.priority);
    const winner = sorted[0];
    const losers = sorted.slice(1).map((g) => g.id);

    // Safety overrides everything
    const safetyGoal = active.find((g) => g.category === 'safety');
    if (safetyGoal && safetyGoal.id !== winner.id) {
      return {
        winner: safetyGoal.id,
        losers: active.filter((g) => g.id !== safetyGoal.id).map((g) => g.id),
        reason: 'safety_override',
      };
    }

    return { winner: winner.id, losers, reason: 'priority' };
  }

  private getActiveGoal(): Goal | null {
    if (!this.activeGoalId) return null;
    return this.goals.get(this.activeGoalId) ?? null;
  }

  private completeGoal(goalId: string): { success: boolean; goal: Goal | null } {
    const goal = this.goals.get(goalId);
    if (!goal) return { success: false, goal: null };

    goal.status = 'completed';
    goal.updatedAt = Date.now();

    if (this.activeGoalId === goalId) {
      this.activeGoalId = null;
      this.prioritizeGoals(); // Pick next
    }

    return { success: true, goal };
  }
}
