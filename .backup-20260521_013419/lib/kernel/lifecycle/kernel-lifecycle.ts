export type LifecycleState =
  | "BOOTING"
  | "RUNNING"
  | "SUSPENDED"
  | "STOPPED"
  | "CRASHED";

class KernelLifecycle {

  private states: Map<string, LifecycleState> = new Map();

  setState(app: string, state: LifecycleState) {

    this.states.set(app, state);

    console.log(
      "[KERNEL LIFECYCLE]",
      app,
      state
    );
  }

  getState(app: string) {
    return this.states.get(app);
  }
}

export const kernelLifecycle = new KernelLifecycle();
