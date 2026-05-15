export function hookupHealthCheck(metrics: any) {

  return {
    app_status:
      metrics.errors < 5
        ? "STABLE"
        : "DEGRADED",

    latency:
      metrics.latency < 300
        ? "OK"
        : "SLOW",

    recommendation:
      metrics.errors > 10
        ? "RESTART_MODULE"
        : "RUNNING"
  };
}
