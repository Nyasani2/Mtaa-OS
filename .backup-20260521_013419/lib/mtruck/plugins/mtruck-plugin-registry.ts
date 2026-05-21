export interface MTruckPlugin {
  id: string;
  name: string;
  version: string;
  init: () => void;
  execute: (context: any) => any;
}

const registry: Record<string, MTruckPlugin> = {};

export function registerPlugin(plugin: MTruckPlugin) {
  registry[plugin.id] = plugin;
}

export function runPlugin(id: string, context: any) {
  const plugin = registry[id];
  if (!plugin) throw new Error("Plugin not found: " + id);
  return plugin.execute(context);
}

export function listPlugins() {
  return Object.values(registry);
}
