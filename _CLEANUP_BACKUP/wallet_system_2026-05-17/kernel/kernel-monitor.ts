export const kernelMonitor = {
  track(event?: any) {
    console.log('[Monitor]', event);
  },

  health() {
    return {
      status: 'healthy',
      timestamp: Date.now(),
    };
  },
};
