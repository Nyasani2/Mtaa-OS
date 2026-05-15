export const kernelMonitor = {
  track(event?: any) {
    console.log('🧠 track', event);
  },

  health() {
    return {
      status: 'healthy',
      uptime: Date.now(),
    };
  },
};
