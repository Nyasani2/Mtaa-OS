export class AnalyticsEngine {
  track(event?: any) {
    console.log('[Analytics]', event);
  }

  health() {
    return {
      status: 'healthy',
      timestamp: Date.now(),
    };
  }
}

export const analyticsEngine = new AnalyticsEngine();
