export function systemHealth(metrics: any) {

  const load = metrics.cpu + metrics.memory;

  return {
    status:
      load < 50
        ? "HEALTHY"
        : load < 80
        ? "STRESSED"
        : "CRITICAL",
    recommendation:
      load > 80
        ? "ACTIVATE_SCALE"
        : "NORMAL_OPERATION",
  };
}
