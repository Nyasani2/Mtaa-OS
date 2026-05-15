export function sandboxHookup() {

  return {
    memory_isolated: true,
    db_namespace: "hookup_*",
    cache_scope: "hookup_only",
    runtime_isolation: true,
    crash_does_not_affect_mtaa_core: true
  };
}
