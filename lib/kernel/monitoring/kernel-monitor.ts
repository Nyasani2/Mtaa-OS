export function monitorKernelEvent(event?: any) {
  console.log('[kernel-monitor]', event);
}

export const kernelMonitor = {
  track: monitorKernelEvent
};
