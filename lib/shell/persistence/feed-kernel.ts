/**
 * ==========================================
 * MTAA FEED KERNEL (PERSISTENT SYSTEM LAYER)
 * ==========================================
 *
 * Feed is NOT a screen.
 * It is a persistent OS service.
 */

class FeedKernel {
  private minimized = false;

  state = {
    scrollPosition: 0,
    lastPostId: null as string | null,
  };

  minimize() {
    this.minimized = true;
  }

  restore() {
    this.minimized = false;
  }

  isMinimized() {
    return this.minimized;
  }

  saveState(pos: number, lastPostId: string | null) {
    this.state.scrollPosition = pos;
    this.state.lastPostId = lastPostId;
  }

  getState() {
    return this.state;
  }
}

export const feedKernel = new FeedKernel();
