export type StateValue = string | number | boolean | object;

export class KernelStateMachine {
  private context: Record<string, StateValue> = {};

  getContext(): Record<string, StateValue> {
    return this.context;
  }

  updateContext(updates: Record<string, StateValue>): void {
    this.context = { ...this.context, ...updates };
  }
}
