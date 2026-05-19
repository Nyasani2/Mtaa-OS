/**
 * MTAA OS — Kernel Index
 * Single entry point for all kernel modules.
 */

export { KernelEventSystem, KernelEvent, KernelEventDomain, KernelEventPriority } from './events/kernel-event-system';
export { KernelRuntime, KernelRuntimeConfig, KernelRuntimeState, KernelRuntimePhase } from './runtime/kernel-runtime';
export { KernelRegistry, AppManifest, AppPermission, AppRoute, MountedApp } from './registry/kernel-registry';
export { KernelScheduler, ScheduledTask } from './runtime/kernel-scheduler';
export { KernelWatchdog, WatchdogService } from './runtime/kernel-watchdog';
export { KernelErrorBoundary, ErrorContext, ErrorReport } from './runtime/kernel-error-boundary';
export { ArchitectureGuard, GuardRule, GuardViolation } from './architecture-guard';
export { BaseApp, AppEntry, AppPackage, createManifest, createPermissions, createRoute } from './app-manifest/app-manifest';
export { NationalRealtimeLayer, NationalStreamType, StreamPacket } from './realtime/national-realtime-layer';
