export function trackKernelMetric(metric?: any) {
  console.log('[kernel-telemetry]', metric);
}

export const kernelTelemetry = {
  track: trackKernelMetric
};
