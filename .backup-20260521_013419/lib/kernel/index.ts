// lib/kernel/index.ts
export { kernel, registerAllModules } from './kernel-bootloader';
export { KernelPanicHandler } from './kernel-panic-handler';
export { SafeModeManager } from './kernel-safe-mode';
export { ServiceManager } from './kernel-service-manager';
export { StateMachine, appStateMachine } from './kernel-state-machine';
export type { KernelModule, KernelState } from './kernel-init';
export { BootGate, BootScreen, ModuleBoundary } from './runtime';
export { TelemetryService, RailService } from './services';
