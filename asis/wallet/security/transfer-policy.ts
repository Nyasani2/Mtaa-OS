// asis/wallet/security/transfer-policy.ts
// ASIS Wallet Transfer Policy Engine
// Imported by: lib/system/adapters/asis-adapter.ts

import { supabase } from '@/lib/supabase';

export interface TransferPolicy {
  id: string;
  name: string;
  enabled: boolean;
  conditions: PolicyCondition[];
  action: 'allow' | 'review' | 'block';
  priority: number;
}

export interface PolicyCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface PolicyEvaluationResult {
  policyId: string;
  policyName: string;
  matched: boolean;
  action: 'allow' | 'review' | 'block';
  reason?: string;
}

export class TransferPolicyEngine {
  private policies: TransferPolicy[] = [
    {
      id: 'max_amount',
      name: 'Maximum Transfer Amount',
      enabled: true,
      conditions: [{ field: 'amount', operator: 'gt', value: 100000 }],
      action: 'review',
      priority: 1,
    },
    {
      id: 'new_recipient',
      name: 'New Recipient Transfer',
      enabled: true,
      conditions: [{ field: 'recipientHistory', operator: 'eq', value: 0 }],
      action: 'review',
      priority: 2,
    },
    {
      id: 'rapid_transfers',
      name: 'Rapid Transfer Detection',
      enabled: true,
      conditions: [{ field: 'transfersInHour', operator: 'gt', value: 5 }],
      action: 'block',
      priority: 3,
    },
  ];

  /**
   * Evaluate all policies against a transfer context
   */
  async evaluate(context: {
    userId: string;
    amount: number;
    recipientId?: string;
    transfersInHour?: number;
    recipientHistory?: number;
  }): Promise<PolicyEvaluationResult[]> {
    const results: PolicyEvaluationResult[] = [];

    for (const policy of this.policies.sort((a, b) => a.priority - b.priority)) {
      if (!policy.enabled) continue;

      const matched = await this.checkConditions(policy.conditions, context);
      results.push({
        policyId: policy.id,
        policyName: policy.name,
        matched,
        action: matched ? policy.action : 'allow',
        reason: matched ? `Policy "${policy.name}" triggered` : undefined,
      });
    }

    return results;
  }

  private async checkConditions(conditions: PolicyCondition[], context: any): Promise<boolean> {
    return conditions.every((condition) => {
      const value = context[condition.field];
      switch (condition.operator) {
        case 'eq': return value === condition.value;
        case 'ne': return value !== condition.value;
        case 'gt': return value > condition.value;
        case 'gte': return value >= condition.value;
        case 'lt': return value < condition.value;
        case 'lte': return value <= condition.value;
        case 'in': return (condition.value as any[]).includes(value);
        case 'contains': return String(value).includes(String(condition.value));
        default: return true;
      }
    });
  }

  /**
   * Get the most restrictive action from evaluation results
   */
  getFinalAction(results: PolicyEvaluationResult[]): 'allow' | 'review' | 'block' {
    const priority: Record<string, number> = { block: 3, review: 2, allow: 1 };
    let finalAction: 'allow' | 'review' | 'block' = 'allow';

    for (const result of results) {
      if (result.matched && priority[result.action] > priority[finalAction]) {
        finalAction = result.action;
      }
    }

    return finalAction;
  }

  /**
   * Add a custom policy
   */
  addPolicy(policy: TransferPolicy): void {
    this.policies.push(policy);
  }

  /**
   * Remove a policy by ID
   */
  removePolicy(id: string): void {
    this.policies = this.policies.filter((p) => p.id !== id);
  }
}

export default TransferPolicyEngine;
