export function useCommandCentre() {
  return {
    loadModules: async () => [],
  };
}

export function useRealtime() {
  const { loadModules } = useCommandCentre();

  return {
    loadModules,
  };
}
