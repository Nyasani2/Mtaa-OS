// lib/kernel/kernel-state-machine.ts
export type StateValue = string | number | boolean | null;

export interface StateTransition {
  from: string;
  to: string;
  event: string;
  guard?: (context: Record<string, StateValue>) => boolean;
  action?: (context: Record<string, StateValue>, payload?: any) => void;
}

export interface StateMachineConfig {
  initial: string;
  states: Record<string, {
    on?: Record<string, { target: string; guard?: string; action?: string }>;
    entry?: string[];
    exit?: string[];
  }>;
  context: Record<string, StateValue>;
  actions?: Record<string, (context: Record<string, StateValue>, payload?: any) => void>;
  guards?: Record<string, (context: Record<string, StateValue>) => boolean>;
}

export class StateMachine {
  private currentState: string;
  private context: Record<string, StateValue>;
  private config: StateMachineConfig;
  private listeners: Set<(state: string, context: Record<string, StateValue>, event: string) => void> = new Set();

  constructor(config: StateMachineConfig) {
    this.config = config;
    this.currentState = config.initial;
    this.context = { ...config.context };
  }

  getState(): string {
    return this.currentState;
  }

  getContext(): Readonly<Record<string, StateValue>> {
    return { ...this.context };
  }

  send(event: string, payload?: any): boolean {
    const stateConfig = this.config.states[this.currentState];
    if (!stateConfig?.on?.[event]) {
      console.warn(`[StateMachine] No transition for event '${event}' in state '${this.currentState}'`);
      return false;
    }

    const transition = stateConfig.on[event];

    // Check guard
    if (transition.guard && this.config.guards?.[transition.guard]) {
      if (!this.config.guards[transition.guard](this.context)) {
        return false;
      }
    }

    // Execute exit actions
    if (stateConfig.exit) {
      for (const actionName of stateConfig.exit) {
        this.config.actions?.[actionName]?.(this.context, payload);
      }
    }

    // Execute transition action
    if (transition.action && this.config.actions?.[transition.action]) {
      this.config.actions[transition.action](this.context, payload);
    }

    // Update state
    const previousState = this.currentState;
    this.currentState = transition.target;

    // Execute entry actions
    const newStateConfig = this.config.states[this.currentState];
    if (newStateConfig.entry) {
      for (const actionName of newStateConfig.entry) {
        this.config.actions?.[actionName]?.(this.context, payload);
      }
    }

    // Notify listeners
    this.listeners.forEach(cb => cb(this.currentState, { ...this.context }, event));

    console.log(`[StateMachine] ${previousState} -> ${this.currentState} via ${event}`);
    return true;
  }

  subscribe(callback: (state: string, context: Record<string, StateValue>, event: string) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  can(event: string): boolean {
    const stateConfig = this.config.states[this.currentState];
    if (!stateConfig?.on?.[event]) return false;

    const transition = stateConfig.on[event];
    if (transition.guard && this.config.guards?.[transition.guard]) {
      return this.config.guards[transition.guard](this.context);
    }

    return true;
  }

  updateContext(updates: Partial<Record<string, StateValue>>) {
    this.context = { ...this.context, ...updates };
  }
}

// App-level state machine
export const appStateMachine = new StateMachine({
  initial: 'booting',
  context: {
    isAuthenticated: false,
    hasWallet: false,
    kycLevel: 0,
    networkStatus: 'online',
  },
  states: {
    booting: {
      on: {
        BOOT_COMPLETE: { target: 'checking_auth' },
        BOOT_FAILED: { target: 'error' },
      },
    },
    checking_auth: {
      on: {
        AUTH_SUCCESS: { target: 'loading_data', action: 'setAuthenticated' },
        AUTH_NONE: { target: 'auth_required' },
        AUTH_ERROR: { target: 'error' },
      },
    },
    auth_required: {
      on: {
        LOGIN: { target: 'authenticating' },
        REGISTER: { target: 'registering' },
      },
    },
    authenticating: {
      on: {
        AUTH_SUCCESS: { target: 'loading_data', action: 'setAuthenticated' },
        AUTH_FAILED: { target: 'auth_required' },
      },
    },
    registering: {
      on: {
        REGISTER_SUCCESS: { target: 'loading_data', action: 'setAuthenticated' },
        REGISTER_FAILED: { target: 'auth_required' },
      },
    },
    loading_data: {
      on: {
        DATA_LOADED: { target: 'ready' },
        DATA_PARTIAL: { target: 'degraded' },
        DATA_FAILED: { target: 'error' },
      },
    },
    ready: {
      on: {
        LOGOUT: { target: 'auth_required', action: 'clearAuth' },
        NETWORK_OFFLINE: { target: 'offline' },
        ERROR: { target: 'error' },
      },
    },
    degraded: {
      on: {
        RETRY: { target: 'loading_data' },
        LOGOUT: { target: 'auth_required', action: 'clearAuth' },
      },
    },
    offline: {
      on: {
        NETWORK_ONLINE: { target: 'ready' },
      },
    },
    error: {
      on: {
        RETRY: { target: 'booting' },
        RESET: { target: 'auth_required', action: 'clearAuth' },
      },
    },
  },
  actions: {
    setAuthenticated: (ctx) => { ctx.isAuthenticated = true; },
    clearAuth: (ctx) => { ctx.isAuthenticated = false; ctx.hasWallet = false; ctx.kycLevel = 0; },
  },
  guards: {
    hasWallet: (ctx) => ctx.hasWallet === true,
    kycComplete: (ctx) => (ctx.kycLevel as number) >= 2,
  },
});
