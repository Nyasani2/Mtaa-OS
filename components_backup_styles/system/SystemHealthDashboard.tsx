/**
 * MTAA OS — System Health Dashboard
 * Runtime monitoring UI for kernel status, realtime queues, event throughput, mounted apps, failed services.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { KernelRuntime } from '@/lib/kernel/runtime/kernel-runtime';
import { KernelEventSystem } from '@/lib/kernel/events/kernel-event-system';
import { KernelRegistry } from '@/lib/kernel/registry/kernel-registry';
import { KernelWatchdog } from '@/lib/kernel/runtime/kernel-watchdog';

interface HealthMetric {
  label: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  trend?: 'up' | 'down' | 'stable';
}

export default function SystemHealthDashboard() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [eventMetrics, setEventMetrics] = useState({ published: 0, delivered: 0, dropped: 0, errors: 0 });
  const [mountedApps, setMountedApps] = useState<string[]>([]);
  const [watchdogStatus, setWatchdogStatus] = useState<{ id: string; healthy: boolean; restarts: number }[]>([]);
  const [errors, setErrors] = useState<{ phase: string; module: string; message: string; time: string }[]>([]);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const runtime = KernelRuntime.getInstance();
    const eventSystem = runtime.getEventSystem();
    const registry = runtime.getRegistry();
    const watchdog = runtime.getWatchdog();

    const update = () => {
      const state = runtime.getState();
      const evMetrics = eventSystem.getMetrics();
      const apps = registry.getMountedApps().map((a) => a.manifest.name);
      const wdStatus = watchdog.getStatus();

      setMetrics([
        { label: 'Kernel Phase', value: state.phase, status: state.phase === 'ready' ? 'healthy' : 'warning' },
        { label: 'Health Score', value: `${state.healthScore}%`, status: state.healthScore > 80 ? 'healthy' : state.healthScore > 50 ? 'warning' : 'critical' },
        { label: 'Active Apps', value: state.activeApps.length, status: state.activeApps.length > 0 ? 'healthy' : 'warning' },
        { label: 'Event Throughput', value: state.eventThroughput, status: 'healthy' },
      ]);

      setEventMetrics(evMetrics);
      setMountedApps(apps);
      setWatchdogStatus(wdStatus);
      setErrors(
        state.errors.slice(-10).map((e) => ({
          phase: e.phase,
          module: e.module,
          message: e.message,
          time: new Date(e.timestamp).toLocaleTimeString(),
        }))
      );
      setUptime(state.uptimeMs);
    };

    update();
    const interval = setInterval(update, 5000);

    // Subscribe to realtime kernel events
    const unsub = eventSystem.subscribe({
      id: 'health-dashboard',
      domain: 'kernel',
      types: ['kernel.runtime.heartbeat', 'kernel.error_boundary.fatal', 'kernel.watchdog.service_unhealthy'],
      handler: () => update(),
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    return `${minutes}m ${seconds % 60}s`;
  };

  const statusColor = (status: HealthMetric['status']) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">MTAA OS System Health</h1>
        <p className="text-slate-400 mt-1">Kernel runtime monitoring & diagnostics</p>
        <div className="mt-3 text-sm text-slate-500">Uptime: {formatUptime(uptime)}</div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{m.label}</span>
              <span style={`w-2.5 h-2.5 rounded-full ${statusColor(m.status)}`} />
            </div>
            <div className="text-2xl font-semibold">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Event System</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Published</span>
              <span className="font-mono">{eventMetrics.published.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Delivered</span>
              <span className="font-mono text-emerald-400">{eventMetrics.delivered.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dropped</span>
              <span className="font-mono text-amber-400">{eventMetrics.dropped.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Errors</span>
              <span className="font-mono text-red-400">{eventMetrics.errors.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Mounted Apps */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Mounted Apps ({mountedApps.length})</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {mountedApps.length === 0 && (
              <div className="text-slate-500 text-sm">No apps currently mounted</div>
            )}
            {mountedApps.map((app) => (
              <div key={app} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm">{app}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Watchdog Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Watchdog Services</h2>
          <div className="space-y-2">
            {watchdogStatus.length === 0 && (
              <div className="text-slate-500 text-sm">No services registered</div>
            )}
            {watchdogStatus.map((svc) => (
              <div key={svc.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-3">
                  <span style={`w-2 h-2 rounded-full ${svc.healthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-sm">{svc.id}</span>
                </div>
                <span className="text-xs text-slate-500">Restarts: {svc.restarts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Recent Errors</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {errors.length === 0 && (
              <div className="text-emerald-400 text-sm">No errors recorded</div>
            )}
            {errors.map((e, i) => (
              <div key={i} className="bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-red-400">[{e.phase}] {e.module}</span>
                  <span className="text-xs text-slate-500">{e.time}</span>
                </div>
                <div className="text-sm text-slate-300">{e.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
