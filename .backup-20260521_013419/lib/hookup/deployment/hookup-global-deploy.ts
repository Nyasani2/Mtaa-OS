export function deployHookup(region: string) {

  return {
    region,
    status: "DEPLOYED",

    infra: {
      db: "sharded_postgres",
      realtime: "distributed_ws",
      cache: "edge_lru",
    },

    scaling: {
      auto_scale: true,
      max_nodes: 1000,
    },

    compliance: {
      privacy_mode: "REGION_ADAPTIVE",
      data_residency: true,
    }
  };
}
