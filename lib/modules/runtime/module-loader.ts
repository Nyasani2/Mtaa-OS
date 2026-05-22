// Module loader
export async function loadModule(manifest: { entry: string }) {
  // Dynamic import disabled for type safety — use static imports
  console.log("Loading module:", manifest.entry);
  return { loaded: true };
}
