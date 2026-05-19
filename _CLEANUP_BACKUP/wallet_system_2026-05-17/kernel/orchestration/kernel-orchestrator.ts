export const kernelOrchestrator = {
  boot() {
    console.log('[Kernel] boot');
  },

  tick(payload?: any) {
    console.log('[Kernel] tick', payload);
  },
};
