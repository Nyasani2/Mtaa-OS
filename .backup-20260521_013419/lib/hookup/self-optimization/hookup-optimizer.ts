export function optimizeSystem(metrics: any) {

  const load = metrics.active_users;
  const fraud = metrics.fraud_rate;
  const engagement = metrics.engagement;

  return {
    scaling_mode:
      load > 1000000
        ? "GLOBAL_SHARDING"
        : load > 100000
        ? "REGIONAL_CLUSTERING"
        : "STANDARD",

    safety_mode:
      fraud > 50 ? "STRICT" : "NORMAL",

    feed_algorithm:
      engagement > 70 ? "AGGRESSIVE_MATCHING" : "BALANCED"
  };
}
